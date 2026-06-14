'use client';

// Frosted field matching the reference design: a translucent rounded box with
// a tiny label on top, a bold value line, and an icon on the RIGHT.
// Password fields swap the icon for a show/hide toggle.

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthFieldProps
  extends Omit<React.ComponentProps<'input'>, 'className'> {
  label: string;
  icon?: React.ReactNode;
}

export function AuthField({ label, icon, type, ...props }: AuthFieldProps) {
  const isPassword = type === 'password';
  const [show, setShow] = useState(false);
  const resolvedType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div className="relative rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 shadow-sm transition-all focus-within:border-zinc-900/40 focus-within:ring-4 focus-within:ring-zinc-900/5">
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      <input
        type={resolvedType}
        className={cn(
          'w-full bg-transparent text-sm font-semibold text-zinc-900 outline-none',
          'placeholder:font-normal placeholder:text-zinc-400',
          (icon || isPassword) && 'pr-7'
        )}
        {...props}
      />

      {isPassword ? (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-700"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      ) : icon ? (
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">
          {icon}
        </span>
      ) : null}
    </div>
  );
}
