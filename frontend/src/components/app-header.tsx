'use client';

// Top header for authenticated pages. Shows logo, primary nav links,
// current user info, and logout button.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/learning-path', label: 'Lộ trình' },
  { href: '/practice/new', label: 'Luyện tập' },
  { href: '/weakness', label: 'Điểm yếu' },
] as const;

// First letter of name for the fallback avatar — falls back to '?' if no name.
const initialOf = (name?: string) =>
  (name?.trim()?.[0] ?? '?').toUpperCase();

export function AppHeader() {
  const { user } = useAuth();
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

        {/* Avatar + tên → trang Profile (đăng xuất nằm trong trang Profile) */}
        {user && (
          <Link
            href="/profile"
            title="Xem hồ sơ"
            className="flex items-center gap-2 shrink-0 rounded-full pl-1 pr-3 py-1 text-sm transition hover:bg-accent"
          >
            {user.profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profile.avatarUrl}
                alt={user.profile.name || 'Avatar'}
                className="h-9 w-9 rounded-full object-cover border"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold border">
                {initialOf(user.profile.name)}
              </div>
            )}
            <span className="font-medium hidden sm:inline">
              {user.profile.name || 'Hồ sơ'}
            </span>
          </Link>
        )}
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
