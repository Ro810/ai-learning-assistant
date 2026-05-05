'use client';

// Landing: redirects authed users to dashboard, guests to login.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? '/dashboard' : '/login');
  }, [loading, user, router]);

  return (
    <main className="flex min-h-screen items-center justify-center text-muted-foreground">
      Đang chuyển hướng...
    </main>
  );
}
