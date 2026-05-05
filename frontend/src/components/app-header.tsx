'use client';

// Top header for authenticated pages. Shows logo + back-to-dashboard button
// (on inner pages) + current user + logout.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

export function AppHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  // Show "← Dashboard" on every inner page; dashboard itself doesn't need it.
  const showBack = pathname !== '/dashboard';

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </Button>
          )}
          <Link href="/dashboard" className="text-lg font-semibold">
            AI Learning Assistant
          </Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {user && (
            <span className="text-muted-foreground hidden sm:inline">
              {user.profile.name} · {user.email}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={logout}>
            Đăng xuất
          </Button>
        </div>
      </div>
    </header>
  );
}
