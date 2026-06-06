"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Prefetch key routes to make the app feel instant after login/app mount
export default function RoutePrefetcher() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();

  useEffect(() => {
    // Always prefetch login & rules
    router.prefetch('/login');
    router.prefetch('/rules');
    
    // Prefetch key routes for logged-in users
    if (isLoggedIn) {
      router.prefetch('/dashboard');
      router.prefetch('/notifications');
      router.prefetch('/mess-bill');
      router.prefetch('/profile');
      
      // Role-aware prefetching for admins
      if (user?.role === 'admin') {
        router.prefetch('/dashboard/upload-mess-bill');
        router.prefetch('/dashboard/manage-users');
        router.prefetch('/dashboard/create-user');
        router.prefetch('/dashboard/monthly-report');
        router.prefetch('/dashboard/audit-logs');
      }
    }
  }, [router, isLoggedIn, user]);

  return null;
}


