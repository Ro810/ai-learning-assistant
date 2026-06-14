'use client';

// Registration page — styled to match the reference (two-column name row like
// First/Last, frosted fields, uppercase title + button). On success → /dashboard.

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/auth-shell';
import { AuthField } from '@/components/auth-field';
import { useAuth } from '@/lib/auth-context';
import { getErrorMessage } from '@/lib/api-client';

export default function RegisterPage() {
  const { register, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [lastName, setLastName] = useState(''); // Họ
  const [firstName, setFirstName] = useState(''); // Tên
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
      // Backend lưu 1 trường `name` → ghép Họ + Tên theo thứ tự tiếng Việt.
      const name = `${lastName} ${firstName}`.trim();
      await register(email, password, name);
      toast.success('Đăng ký thành công, chào mừng!');
      router.replace('/dashboard');
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell altAction={{ label: 'Đăng nhập', href: '/login' }}>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Bắt đầu miễn phí
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-extrabold uppercase tracking-tight text-zinc-900 sm:text-5xl">
        Tạo tài khoản
      </h1>
      <div className="mt-3 h-[3px] w-full rounded-full bg-zinc-900/85" />
      <p className="mt-4 mb-7 text-sm text-zinc-600">
        Đã là thành viên?{' '}
        <Link href="/login" className="font-semibold text-zinc-900 underline underline-offset-2 hover:text-zinc-600">
          Đăng nhập
        </Link>
      </p>

      <form onSubmit={onSubmit} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <AuthField
            label="Họ"
            icon={<User className="h-4 w-4" />}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            placeholder="Nguyễn"
            disabled={submitting}
            autoComplete="family-name"
          />
          <AuthField
            label="Tên"
            icon={<User className="h-4 w-4" />}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            placeholder="An"
            disabled={submitting}
            autoComplete="given-name"
          />
        </div>
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
          minLength={6}
          placeholder="Tối thiểu 6 ký tự"
          disabled={submitting}
          autoComplete="new-password"
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          className="mt-3 h-12 rounded-xl bg-zinc-900 px-12 text-sm font-bold uppercase tracking-wider hover:bg-zinc-800"
          disabled={submitting}
        >
          {submitting ? 'Đang xử lý...' : 'Tạo tài khoản'}
        </Button>
      </form>
    </AuthShell>
  );
}
