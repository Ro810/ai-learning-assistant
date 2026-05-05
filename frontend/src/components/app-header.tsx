'use client';

// Top header for authenticated pages. Shows app name + current user + logout.

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

export function AppHeader() {
  const { user, logout } = useAuth();
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-semibold">
          AI Learning Assistant
        </Link>
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
