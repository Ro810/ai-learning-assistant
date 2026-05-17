'use client';

// Login page. On success, redirects to /dashboard.
// Centered card layout with playful learning-themed hero icon.

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10 shadow-sm">
          {/* Hero icon — graduation cap with floating decorations */}
          <HeroIcon />

          <div className="text-center space-y-1.5 mt-6 mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">
              Xin chào, bạn đã trở lại!
            </h1>
            <p className="text-sm text-muted-foreground">
              Đăng nhập để tiếp tục lộ trình học của bạn.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ban@example.com"
                disabled={submitting}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Mật khẩu</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
                className="h-11 rounded-xl"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full h-11 rounded-xl text-base font-semibold mt-2"
              disabled={submitting}
            >
              {submitting ? (
                'Đang đăng nhập...'
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{' '}
          <Link
            href="/register"
            className="font-semibold text-foreground hover:underline"
          >
            Đăng ký miễn phí
          </Link>
        </p>
      </div>
    </main>
  );
}

// Decorative hero — big graduation cap with two floating mini-icons.
// Pure CSS / lucide; no image asset needed.
function HeroIcon() {
  return (
    <div className="relative mx-auto w-fit">
      <div className="h-20 w-20 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-lg shadow-zinc-900/15">
        <GraduationCap className="h-10 w-10 text-white" strokeWidth={2} />
      </div>
      <div className="absolute -top-2 -right-3 h-9 w-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-sm rotate-12">
        <Sparkles className="h-4 w-4 text-zinc-700" />
      </div>
      <div className="absolute -bottom-2 -left-3 h-9 w-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-sm -rotate-12">
        <BookOpen className="h-4 w-4 text-zinc-700" />
      </div>
    </div>
  );
}
