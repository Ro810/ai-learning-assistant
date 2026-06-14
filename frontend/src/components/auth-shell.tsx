'use client';

// Auth screen frame — illustrated landing-page style (à la the reference):
// clean white canvas, soft organic gray blobs, and a hand-drawn monochrome
// learning illustration on the right. Form sits on the left. Top: logo + link.

import Link from 'next/link';

interface AltAction {
  label: string;
  href: string;
}

interface AuthShellProps {
  children: React.ReactNode;
  altAction: AltAction;
}

export function AuthShell({ children, altAction }: AuthShellProps) {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-white">
      {/* Decorative wavy shapes (monochrome) — flowing curves, not circles */}
      {/* Left: vertical wavy band behind the form */}
      <svg
        aria-hidden
        className="absolute left-0 top-0 h-full w-[44%] sm:w-[38%]"
        viewBox="0 0 400 1000"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M0 0 H250 C300 130 200 240 265 380 C320 500 200 600 275 740 C325 845 235 935 255 1000 H0 Z"
          fill="#f4f4f5"
        />
        <path
          d="M0 0 H205 C250 120 165 235 220 365 C268 480 165 585 225 720 C272 825 200 930 215 1000 H0 Z"
          fill="#fafafa"
        />
      </svg>

      {/* Subtle wavy accent line */}
      <svg
        aria-hidden
        className="absolute bottom-16 left-8 hidden h-16 w-48 text-zinc-200 sm:block"
        viewBox="0 0 200 60"
        fill="none"
      >
        <path
          d="M5 30 C30 5 50 55 75 30 C100 5 120 55 145 30 C170 5 190 45 195 30"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      {/* Illustration with a wavy gradient blob hugging the character */}
      <div className="pointer-events-none absolute right-[2%] top-1/2 hidden w-[50%] max-w-[740px] -translate-y-1/2 select-none lg:block xl:right-[5%]">
        {/* Wavy organic blob behind the person (soft gray gradient) */}
        <svg
          aria-hidden
          className="absolute -top-[16%] -left-[10%] h-[132%] w-[120%]"
          viewBox="0 0 600 560"
          fill="none"
        >
          <defs>
            <linearGradient id="blobGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fafafa" />
              <stop offset="55%" stopColor="#f0f0f1" />
              <stop offset="100%" stopColor="#dededf" />
            </linearGradient>
          </defs>
          <path
            d="M305 18 C405 8 470 70 510 150 C548 226 590 270 562 360 C536 444 470 460 410 500 C342 545 280 542 210 512 C140 482 70 470 44 388 C18 306 70 248 92 178 C116 102 150 48 230 28 C258 21 278 21 305 18 Z"
            fill="url(#blobGrad)"
          />
        </svg>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/learning-illustration.svg"
          alt="Minh họa học trực tuyến"
          className="relative w-full"
        />
      </div>

      {/* Top nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10 lg:px-16">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 transition-transform group-hover:scale-105">
            <GraduationCapMark />
          </span>
          <span className="text-sm font-semibold tracking-tight text-zinc-900">
            AI Learning Assistant
          </span>
        </Link>

        <nav className="hidden items-center gap-2 text-sm font-medium text-zinc-600 sm:flex">
          <Link href="/" className="rounded-lg px-3 py-1.5 transition-colors hover:text-zinc-900">
            Trang chủ
          </Link>
          <Link
            href={altAction.href}
            className="rounded-lg border border-zinc-200 bg-white px-3.5 py-1.5 text-zinc-900 transition-colors hover:bg-zinc-100"
          >
            {altAction.label}
          </Link>
        </nav>
      </header>

      {/* Form — left aligned */}
      <div className="relative z-10 flex min-h-[calc(100vh-5.25rem)] items-center px-6 pb-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </main>
  );
}

// Small graduation-cap glyph for the logo mark (inline SVG, white on dark).
function GraduationCapMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
    </svg>
  );
}
