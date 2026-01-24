import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/client-auth';

/**
 * Hook to protect pages from paywall users
 * Redirects gurjyot user to paywall
 */
export function usePaywallProtection() {
  const router = useRouter();
  const { getUsername } = useAuth();

  useEffect(() => {
    const username = getUsername();
    
    // Redirect gurjyot to paywall
    if (username === 'gurjyot') {
      router.push('/paywall');
    }
  }, [router, getUsername]);
}
