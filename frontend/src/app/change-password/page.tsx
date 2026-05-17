'use client';

// Change password form: validates match + min-length before submitting.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';

function ChangePasswordInner() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu không khớp.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Mật khẩu mới phải khác mật khẩu hiện tại.');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success('Đổi mật khẩu thành công!');
      router.push('/profile');
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-md px-4 py-6 space-y-6">
        <section>
          <h1 className="text-2xl font-semibold">Đổi mật khẩu</h1>
          <p className="text-sm text-muted-foreground">
            Nhập mật khẩu hiện tại và mật khẩu mới để cập nhật.
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin mật khẩu</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Mật khẩu hiện tại</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Mật khẩu mới</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ít nhất 8 ký tự"
                  autoComplete="new-password"
                  disabled={submitting}
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Xác nhận mật khẩu mới</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                  disabled={submitting}
                  required
                />
              </div>

              {error && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push('/profile')}
                  disabled={submitting}
                >
                  Hủy
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <ProtectedRoute>
      <ChangePasswordInner />
    </ProtectedRoute>
  );
}
