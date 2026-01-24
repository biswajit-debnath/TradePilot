import { AsyncLocalStorage } from 'async_hooks';
import { NextRequest } from 'next/server';

export const requestContext = new AsyncLocalStorage<NextRequest>();

export function getRequestFromContext(): NextRequest | undefined {
  return requestContext.getStore();
}
