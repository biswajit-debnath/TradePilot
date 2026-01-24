import { getMongoDb } from './mongo-client';
import { AuthContext } from '@/types/auth';

type LogParams = {
  endpoint: string;
  method: string;
  requestBody?: unknown;
  responseStatus?: number;
  responseBody?: unknown;
  errorMessage?: string;
  durationMs?: number;
  correlationId?: string;
  user?: AuthContext;
};

/**
 * Insert a single external-call log document into MongoDB.
 * Logs to console if MongoDB is unavailable.
 */
export async function logExternalCall(params: LogParams): Promise<void> {
  try {
    const db = await getMongoDb();
    if (!db) {
      console.log('[API-LOGGER] MongoDB not configured, logging to console:', {
        endpoint: params.endpoint,
        method: params.method,
        status: params.responseStatus,
        error: params.errorMessage,
        durationMs: params.durationMs,
      });
      return;
    }

    const collection = db.collection('api-logger');
    const result = await collection.insertOne({
      timestamp: new Date(),
      username: params.user?.username || 'anonymous',
      endpoint: params.endpoint,
      method: params.method,
      requestBody: params.requestBody,
      responseStatus: params.responseStatus,
      responseBody: params.responseBody,
      errorMessage: params.errorMessage,
      durationMs: params.durationMs,
      correlationId: params.correlationId,
    });
    console.log('[API-LOGGER] Logged to MongoDB:', result.insertedId, 'User:', params.user?.username || 'anonymous');
  } catch (error) {
    console.error('[API-LOGGER] Failed to log external call:', error instanceof Error ? error.message : error);
  }
}
