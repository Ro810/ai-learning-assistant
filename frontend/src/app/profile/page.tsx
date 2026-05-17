'use client';

// Profile page: edit personal info + manage learning goals.
// Uses useAuth() for current user; refreshes local state after mutation
// by calling authApi.me() since AuthContext has no refreshUser method.

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';
import { authApi, subjectApi, userApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';
import type { Subject, User } from '@/lib/types';

const levelLabels: Record<string, string> = {
  basic: 'Cơ bản',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao',
};

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN');
}

function ProfileInner() {
  const { user: ctxUser } = useAuth();
  // Local user copy so we can update after mutations without touching AuthContext
  const [user, setUser] = useState<User | null>(ctxUser);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);

  // Profile form
  const [name, setName] = useState(ctxUser?.profile.name ?? '');
  const [grade, setGrade] = useState(ctxUser?.profile.grade ?? '');
  const [avatarUrl, setAvatarUrl] = useState(ctxUser?.profile.avatarUrl ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Learning goal form
  const [goalSubjectId, setGoalSubjectId] = useState('');
  const [goalLevel, setGoalLevel] = useState<'basic' | 'intermediate' | 'advanced'>('basic');
  const [goalDate, setGoalDate] = useState('');
  const [addingGoal, setAddingGoal] = useState(false);
  const [removingGoalId, setRemovingGoalId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    subjectApi
      .list()
      .then((data) => {
        if (!active) return;
        setSubjects(data);
        if (data.length > 0) setGoalSubjectId(data[0]._id);
      })
      .catch(() => {/* subjects not critical */})
      .finally(() => active && setSubjectsLoading(false));
    return () => { active = false; };
  }, []);

  // Refresh local user from /auth/me after any mutation
  const refreshUser = async () => {
    try {
      const updated = await authApi.me();
      setUser(updated);
      return updated;
    } catch {
      // Non-fatal — local state already updated by API response
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Tên không được để trống.'); return; }
    setSavingProfile(true);
    try {
      await userApi.updateProfile({
        name: name.trim(),
        grade: grade.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      toast.success('Đã cập nhật thông tin cá nhân.');
      await refreshUser();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalSubjectId) { toast.error('Vui lòng chọn môn học.'); return; }
    if (!goalDate) { toast.error('Vui lòng chọn ngày mục tiêu.'); return; }
    setAddingGoal(true);
    try {
      const updated = await userApi.addLearningGoal({
        subjectId: goalSubjectId,
        targetLevel: goalLevel,
        targetDate: goalDate,
      });
      setUser(updated);
      setGoalDate('');
      toast.success('Đã thêm mục tiêu học tập.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAddingGoal(false);
    }
  };

  const handleRemoveGoal = async (subjectId: string) => {
    if (!confirm('Xóa mục tiêu này?')) return;
    setRemovingGoalId(subjectId);
    try {
      const updated = await userApi.removeLearningGoal(subjectId);
      setUser(updated);
      toast.success('Đã xóa mục tiêu học tập.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemovingGoalId(null);
    }
  };

  const subjectName = (id: string) =>
    subjects.find((s) => s._id === id)?.name ?? id.slice(-6);

  const goals = user?.learningGoals ?? [];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-6 space-y-8">
        <section>
          <h1 className="text-2xl font-semibold">Hồ sơ cá nhân</h1>
          <p className="text-sm text-muted-foreground">
            Cập nhật thông tin và quản lý mục tiêu học tập.
          </p>
        </section>

        {/* Personal info */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <Input value={user?.email ?? ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Tên hiển thị</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  disabled={savingProfile}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Lớp / Khối</label>
                <Input
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="VD: 12A1, Lớp 10..."
                  disabled={savingProfile}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Avatar URL</label>
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  disabled={savingProfile}
                />
              </div>
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? 'Đang lưu...' : 'Lưu thông tin'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator />

        {/* Learning goals */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Mục tiêu học tập</h2>

          {/* Existing goals */}
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có mục tiêu nào.</p>
          ) : (
            <div className="space-y-2">
              {goals.map((g) => {
                const isRemoving = removingGoalId === g.subjectId;
                return (
                  <Card key={g.subjectId}>
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{subjectName(g.subjectId)}</span>
                          <Badge variant="outline">
                            {levelLabels[g.targetLevel] ?? g.targetLevel}
                          </Badge>
                        </div>
                        {g.targetDate && (
                          <p className="text-xs text-muted-foreground">
                            Mục tiêu: {formatDate(g.targetDate)}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveGoal(g.subjectId)}
                        disabled={isRemoving}
                        className="text-destructive hover:text-destructive"
                      >
                        {isRemoving ? '...' : 'Xóa'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Add goal form */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Thêm mục tiêu mới</CardTitle>
            </CardHeader>
            <CardContent>
              {subjectsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <form onSubmit={handleAddGoal} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Môn học</label>
                    <select
                      value={goalSubjectId}
                      onChange={(e) => setGoalSubjectId(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      disabled={addingGoal}
                    >
                      {subjects.map((s) => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Cấp độ mục tiêu</label>
                    <select
                      value={goalLevel}
                      onChange={(e) =>
                        setGoalLevel(e.target.value as 'basic' | 'intermediate' | 'advanced')
                      }
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      disabled={addingGoal}
                    >
                      <option value="basic">Cơ bản</option>
                      <option value="intermediate">Trung cấp</option>
                      <option value="advanced">Nâng cao</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Ngày mục tiêu</label>
                    <input
                      type="date"
                      value={goalDate}
                      onChange={(e) => setGoalDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      disabled={addingGoal}
                    />
                  </div>
                  <Button type="submit" size="sm" disabled={addingGoal}>
                    {addingGoal ? 'Đang thêm...' : 'Thêm mục tiêu'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileInner />
    </ProtectedRoute>
  );
}
