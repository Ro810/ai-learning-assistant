'use client';

// Top header for authenticated pages. Shows logo, primary nav links,
// current user info, and logout button.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/learning-path', label: 'Lộ trình' },
  { href: '/practice/new', label: 'Luyện tập' },
  { href: '/weakness', label: 'Điểm yếu' },
  { href: '/profile', label: 'Hồ sơ' },
] as const;

export function AppHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo + nav */}
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/dashboard" className="text-base font-semibold shrink-0">
            AI Learning
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              // Active: exact match for dashboard, prefix match for sub-routes
              const isActive =
                href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-accent font-medium text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User info + logout */}
        <div className="flex items-center gap-3 text-sm shrink-0">
          {user && (
            <Link
              href="/profile"
              className="text-muted-foreground hidden md:inline hover:text-foreground transition-colors"
            >
              {user.profile.name}
            </Link>
          )}
          <Button variant="outline" size="sm" onClick={logout}>
            Đăng xuất
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="sm:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
        {NAV_LINKS.map(({ href, label }) => {
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`shrink-0 rounded-md px-3 py-1 text-xs transition-colors ${
                isActive
                  ? 'bg-accent font-medium text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
