'use client';

// Login page — styled to match the reference (eyebrow + big underlined title +
// member link + frosted fields + uppercase button). On success → /dashboard.

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/auth-shell';
import { AuthField } from '@/components/auth-field';
import { useAuth } from '@/lib/auth-context';
import { getErrorMessage } from '@/lib/api-client';

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) router.replace('/dashboard');
  }, [authLoading, user, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Đăng nhập thành công');
      router.replace('/dashboard');
    } catch (err) {
      // Backend trả 'Invalid email or password' cho cả 2 trường hợp sai
      // (cố ý — chống user enumeration). Map sang tiếng Việt thân thiện.
      const raw = getErrorMessage(err);
      const msg = /invalid email or password/i.test(raw)
        ? 'Email hoặc mật khẩu không đúng.'
        : raw;
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell altAction={{ label: 'Đăng ký', href: '/register' }}>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Bắt đầu miễn phí
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-extrabold uppercase tracking-tight text-zinc-900 sm:text-5xl">
        Đăng nhập
      </h1>
      <div className="mt-3 h-[3px] w-full rounded-full bg-zinc-900/85" />
      <p className="mt-4 mb-7 text-sm text-zinc-600">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="font-semibold text-zinc-900 underline underline-offset-2 hover:text-zinc-600">
          Đăng ký ngay
        </Link>
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
        <AuthField
          label="Mật khẩu"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          disabled={submitting}
          autoComplete="current-password"
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          className="mt-3 h-12 rounded-xl bg-zinc-900 px-12 text-sm font-bold uppercase tracking-wider hover:bg-zinc-800"
          disabled={submitting}
        >
          {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>
    </AuthShell>
  );
}
