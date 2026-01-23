import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'tradepilot';

type MongoGlobals = typeof globalThis & {
  __mongoClient?: MongoClient;
  __mongoDb?: Db;
};

const globalWithMongo = globalThis as MongoGlobals;

/**
 * Reuse a single MongoDB client across API route invocations.
 * Returns null when Mongo is not configured or running in the browser.
 */
export async function getMongoDb(): Promise<Db | null> {
  if (typeof window !== 'undefined') return null;
  
  if (!uri) {
    console.warn('[MONGO-CLIENT] MONGODB_URI not set; skipping external-call logging');
    return null;
  }

  if (globalWithMongo.__mongoClient && globalWithMongo.__mongoDb) {
    console.log('[MONGO-CLIENT] Reusing existing MongoDB connection');
    return globalWithMongo.__mongoDb;
  }

  try {
    console.log('[MONGO-CLIENT] Establishing new MongoDB connection...');
    const client = new MongoClient(uri);
    await client.connect();
    console.log('[MONGO-CLIENT] Connected to MongoDB');
    
    const db = client.db(dbName);

    globalWithMongo.__mongoClient = client;
    globalWithMongo.__mongoDb = db;

    return db;
  } catch (error) {
    console.error('[MONGO-CLIENT] Connection failed:', error instanceof Error ? error.message : error);
    return null;
  }
}
