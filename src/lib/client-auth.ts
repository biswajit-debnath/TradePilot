import { ReactNode } from 'react';

/**
 * Client-side auth check hook
 * Usage in 'use client' components
 */
export function useAuth() {
  const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  };

  const getUsername = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('username');
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('username');
      window.location.href = '/auth';
    }
  };

  const isAuthenticated = () => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('auth_token');
  };

  return { getToken, getUsername, logout, isAuthenticated };
}

/**
 * Get auth header for API calls
 */
export function getAuthHeader(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
