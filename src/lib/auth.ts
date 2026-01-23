import { hash, compare } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { getMongoDb } from './mongo-client';
import { User, AuthPayload, LoginRequest, LoginResponse, AuthContext } from '@/types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Hash a plaintext password
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

/**
 * Compare plaintext password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

/**
 * Generate JWT token
 */
export function generateToken(payload: AuthPayload): string {
  return sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): AuthPayload | null {
  try {
    return verify(token, JWT_SECRET) as AuthPayload;
  } catch (error) {
    console.error('[AUTH] Token verification failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Login with username and password
 */
export async function login(request: LoginRequest): Promise<LoginResponse> {
  try {
    const db = await getMongoDb();
    if (!db) {
      return { success: false, error: 'Database connection failed' };
    }

    const usersCollection = db.collection<User>('users');
    const user = await usersCollection.findOne({ username: request.username });

    if (!user) {
      return { success: false, error: 'Invalid username or password' };
    }

    const passwordValid = await comparePassword(request.password, user.passwordHash);
    if (!passwordValid) {
      return { success: false, error: 'Invalid username or password' };
    }

    const token = generateToken({
      userId: user._id!.toString(),
      username: user.username,
    });

    console.log('[AUTH] Login successful for user:', user.username);

    return {
      success: true,
      token,
      user: {
        userId: user._id!.toString(),
        username: user.username,
      },
    };
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    return { success: false, error: 'Login failed' };
  }
}

/**
 * Register a new user
 */
export async function register(username: string, password: string): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    const db = await getMongoDb();
    if (!db) {
      return { success: false, error: 'Database connection failed' };
    }

    const usersCollection = db.collection<User>('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      return { success: false, error: 'User already exists' };
    }

    const passwordHash = await hashPassword(password);
    const result = await usersCollection.insertOne({
      username,
      passwordHash,
      createdAt: new Date(),
    } as Omit<User, '_id'>);

    console.log('[AUTH] User registered:', username);

    return { success: true, userId: result.insertedId.toString() };
  } catch (error) {
    console.error('[AUTH] Register error:', error);
    return { success: false, error: 'Registration failed' };
  }
}

/**
 * Extract user from Authorization header
 */
export function extractUserFromHeader(authHeader?: string): AuthContext | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  return {
    userId: payload.userId,
    username: payload.username,
  };
}
