'use client';

// Quên mật khẩu — nhập email để nhận link đặt lại. Thông điệp luôn như nhau
// (không lộ email tồn tại hay không). Dev chưa có SMTP → hiện thẳng link để test.

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/auth-shell';
import { AuthField } from '@/components/auth-field';
import { authApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  // Dev: link reset trả về khi chưa cấu hình email server.
  const [devUrl, setDevUrl] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword(email);
      setSent(true);
      setDevUrl(res?.resetUrl ?? null);
      toast.success('Đã gửi yêu cầu đặt lại mật khẩu.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell altAction={{ label: 'Đăng nhập', href: '/login' }}>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Khôi phục tài khoản
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-extrabold uppercase tracking-tight text-zinc-900 sm:text-5xl">
        Quên mật khẩu
      </h1>
      <div className="mt-3 h-[3px] w-full rounded-full bg-zinc-900/85" />

      {sent ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-zinc-600">
            Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu. Kiểm tra hộp thư của bạn.
          </p>
          {devUrl && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
              <p className="font-medium text-amber-800">Dev mode (chưa cấu hình email):</p>
              <Link href={devUrl} className="break-all text-amber-900 underline">
                {devUrl}
              </Link>
            </div>
          )}
          <Link
            href="/login"
            className="inline-block text-sm font-semibold text-zinc-900 underline underline-offset-2 hover:text-zinc-600"
          >
            ← Về đăng nhập
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-4 mb-7 text-sm text-zinc-600">
            Nhập email tài khoản, chúng tôi sẽ gửi link đặt lại mật khẩu.
          </p>
          <form onSubmit={onSubmit} className="space-y-3.5">
            <AuthField
              label="Email"
              icon={<Mail className="h-4 w-4" />}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ban@example.com"
              disabled={submitting}
              autoComplete="email"
            />
            <Button
              type="submit"
              className="mt-3 h-12 rounded-xl bg-zinc-900 px-12 text-sm font-bold uppercase tracking-wider hover:bg-zinc-800"
              disabled={submitting}
            >
              {submitting ? 'Đang gửi...' : 'Gửi link đặt lại'}
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
