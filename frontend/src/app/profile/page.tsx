'use client';

// Profile page: edit personal info + manage learning goals.
// Uses useAuth() for current user; refreshes local state after mutation
// by calling authApi.me() since AuthContext has no refreshUser method.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Pencil, X, KeyRound } from 'lucide-react';
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

// Max source image size accepted before resize (to avoid loading huge files
// into a canvas). After resize avatar is typically only 10-30KB.
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const AVATAR_MAX_DIM = 256;
const AVATAR_QUALITY = 0.85;

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Đọc file thất bại'));
    reader.readAsDataURL(file);
  });

// Downscale + re-encode an image file as JPEG via a canvas, capped at
// AVATAR_MAX_DIM on the longest side. Returns a much smaller base64 data URL
// suitable for storing inline in MongoDB without bloating user documents.
const resizeImageToDataUrl = async (file: File): Promise<string> => {
  const sourceDataUrl = await readFileAsDataUrl(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Không decode được ảnh.'));
    el.src = sourceDataUrl;
  });

  const scale = Math.min(1, AVATAR_MAX_DIM / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Trình duyệt không hỗ trợ canvas.');
  ctx.drawImage(img, 0, 0, w, h);

  // JPEG (not PNG) — much smaller for photographic avatars
  return canvas.toDataURL('image/jpeg', AVATAR_QUALITY);
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
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(ctxUser?.profile.name ?? '');
  const [grade, setGrade] = useState(ctxUser?.profile.grade ?? '');
  // avatarUrl holds either an http(s) URL from server or a base64 data URL
  // from a freshly picked local file. Both are valid for `<img src>` and
  // pass backend Zod `.string().url()` validation.
  const [avatarUrl, setAvatarUrl] = useState(ctxUser?.profile.avatarUrl ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form fields from user when entering edit mode or when user data
  // arrives after first render (AuthContext can be null on initial paint).
  useEffect(() => {
    if (!isEditing) {
      setName(user?.profile.name ?? '');
      setGrade(user?.profile.grade ?? '');
      setAvatarUrl(user?.profile.avatarUrl ?? '');
    }
  }, [user, isEditing]);

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

  const handlePickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input so the same file can be re-selected after a failed try
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Ảnh quá lớn (tối đa 5MB).');
      return;
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setAvatarUrl(dataUrl);
    } catch (err: any) {
      toast.error(err?.message ?? 'Không xử lý được file ảnh.');
    }
  };

  const handleRemoveAvatar = () => setAvatarUrl('');

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
      setIsEditing(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    // Revert form fields to last saved values, then exit edit mode
    setName(user?.profile.name ?? '');
    setGrade(user?.profile.grade ?? '');
    setAvatarUrl(user?.profile.avatarUrl ?? '');
    setIsEditing(false);
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Thông tin cá nhân</CardTitle>
            {isEditing ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleCancelEdit}
                disabled={savingProfile}
                aria-label="Hủy chỉnh sửa"
                title="Hủy"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                aria-label="Chỉnh sửa thông tin"
                title="Chỉnh sửa"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isEditing ? (
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ảnh đại diện</label>
                  <div className="flex items-center gap-4">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt="Avatar preview"
                        className="h-16 w-16 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePickAvatar}
                        className="hidden"
                        disabled={savingProfile}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={savingProfile}
                        >
                          {avatarUrl ? 'Đổi ảnh' : 'Chọn ảnh'}
                        </Button>
                        {avatarUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveAvatar}
                            disabled={savingProfile}
                            className="text-destructive hover:text-destructive"
                          >
                            Gỡ ảnh
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        PNG/JPG, tối đa 5MB. Ảnh sẽ được nén còn ~256px.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={savingProfile}>
                    {savingProfile ? 'Đang lưu...' : 'Lưu thông tin'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={savingProfile}
                  >
                    Hủy
                  </Button>
                </div>
              </form>
            ) : (
              // Display mode — read-only view, switch to edit via the pencil icon above
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {user?.profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.profile.avatarUrl}
                      alt="Avatar"
                      className="h-20 w-20 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-medium">
                      {user?.profile.name || '—'}
                    </p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Lớp / Khối</p>
                    <p className="font-medium">{user?.profile.grade || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ngày tham gia</p>
                    <p className="font-medium">{formatDate(user?.createdAt)}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Bảo mật</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/change-password">
                <KeyRound className="h-4 w-4 mr-2" />
                Đổi mật khẩu
              </Link>
            </Button>
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
