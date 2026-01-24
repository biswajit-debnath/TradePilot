export interface User {
  _id?: string;
  username: string;
  email?: string;
  passwordHash: string;
  createdAt: Date;
}

export interface AuthPayload {
  userId: string;
  username: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    userId: string;
    username: string;
  };
  error?: string;
}

export interface AuthContext {
  userId: string;
  username: string;
}
