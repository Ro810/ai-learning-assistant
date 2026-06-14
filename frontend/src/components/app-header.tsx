'use client';

// Top header for authenticated pages. Logo + primary nav + user avatar.
// Styled to match the auth screens: white bar, graduation-cap mark, pill nav
// with a solid-dark active state.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationBell } from '@/components/notification-bell';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Tổng quan' },
  { href: '/learning-path', label: 'Lộ trình' },
  { href: '/practice/new', label: 'Luyện tập' },
  { href: '/weakness', label: 'Điểm yếu' },
  { href: '/bookmarks', label: 'Đã lưu' },
] as const;

const initialOf = (name?: string) => (name?.trim()?.[0] ?? '?').toUpperCase();

const isActiveLink = (href: string, pathname: string) =>
  href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

export function AppHeader() {
  const { user } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/85 backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/85">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo + nav */}
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/dashboard" className="group flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 transition-transform group-hover:scale-105 dark:bg-zinc-700">
              <GraduationCapMark />
            </span>
            <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              AI Learning Assistant
            </span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_LINKS.map(({ href, label }) => {
              const active = isActiveLink(href, pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? 'bg-zinc-900 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Theme toggle + Avatar/name → Profile (logout lives in Profile) */}
        <div className="flex shrink-0 items-center gap-1">
          {user && <NotificationBell />}
          <ThemeToggle />
          {user && (
          <Link
            href="/profile"
            title="Xem hồ sơ"
            className="flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {user.profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profile.avatarUrl}
                alt={user.profile.name || 'Avatar'}
                className="h-9 w-9 rounded-full border border-zinc-200 object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-600">
                {initialOf(user.profile.name)}
              </div>
            )}
            <span className="hidden font-medium text-zinc-900 sm:inline dark:text-zinc-100">
              {user.profile.name || 'Hồ sơ'}
            </span>
          </Link>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex items-center gap-1 overflow-x-auto px-4 pb-2 sm:hidden">
        {NAV_LINKS.map(({ href, label }) => {
          const active = isActiveLink(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`shrink-0 rounded-lg px-3 py-1 text-xs transition-colors ${
                active
                  ? 'bg-zinc-900 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
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

// Graduation-cap glyph (white on dark) — same mark as the auth screens.
function GraduationCapMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
    </svg>
  );
}
