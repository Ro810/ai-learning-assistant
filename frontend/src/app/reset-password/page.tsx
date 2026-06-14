'use client';

// Đặt lại mật khẩu bằng token từ link email (?token=...). Nhập mật khẩu mới +
// xác nhận → gọi API → về đăng nhập.

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/auth-shell';
import { AuthField } from '@/components/auth-field';
import { authApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword({ token, newPassword: password });
      toast.success('Đặt lại mật khẩu thành công. Hãy đăng nhập.');
      router.replace('/login');
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
      setSubmitting(false);
    }
  };

  return (
    <AuthShell altAction={{ label: 'Đăng nhập', href: '/login' }}>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Khôi phục tài khoản
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-extrabold uppercase tracking-tight text-zinc-900 sm:text-5xl">
        Đặt lại mật khẩu
      </h1>
      <div className="mt-3 h-[3px] w-full rounded-full bg-zinc-900/85" />

      {!token ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-destructive">
            Link không hợp lệ (thiếu token). Hãy yêu cầu lại link đặt lại mật khẩu.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block text-sm font-semibold text-zinc-900 underline underline-offset-2 hover:text-zinc-600"
          >
            ← Yêu cầu link mới
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-4 mb-7 text-sm text-zinc-600">Nhập mật khẩu mới cho tài khoản.</p>
          <form onSubmit={onSubmit} className="space-y-3.5">
            <AuthField
              label="Mật khẩu mới"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              disabled={submitting}
              autoComplete="new-password"
            />
            <AuthField
              label="Xác nhận mật khẩu"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="••••••••"
              disabled={submitting}
              autoComplete="new-password"
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              className="mt-3 h-12 rounded-xl bg-zinc-900 px-12 text-sm font-bold uppercase tracking-wider hover:bg-zinc-800"
              disabled={submitting}
            >
              {submitting ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-6 text-zinc-500">Đang tải...</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
