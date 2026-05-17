'use client';

// Profile page: edit personal info + manage learning goals + account actions.
// Refresh local user state after mutations by calling authApi.me() since
// AuthContext has no refreshUser method.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Pencil,
  X,
  KeyRound,
  LogOut,
  ChevronRight,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  return canvas.toDataURL('image/jpeg', AVATAR_QUALITY);
};

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN');
}

const initialOf = (name?: string) =>
  (name?.trim()?.[0] ?? '?').toUpperCase();

function ProfileInner() {
  const { user: ctxUser, logout } = useAuth();
  const [user, setUser] = useState<User | null>(ctxUser);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);

  // Edit-profile state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(ctxUser?.profile.name ?? '');
  const [grade, setGrade] = useState(ctxUser?.profile.grade ?? '');
  const [avatarUrl, setAvatarUrl] = useState(ctxUser?.profile.avatarUrl ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Learning-goal state
  const [showGoalForm, setShowGoalForm] = useState(false);
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
      .catch(() => { /* subjects not critical */ })
      .finally(() => active && setSubjectsLoading(false));
    return () => { active = false; };
  }, []);

  // Sync form fields from user when not currently editing (handles late-arrival
  // of AuthContext data, or post-save refresh).
  useEffect(() => {
    if (!isEditing) {
      setName(user?.profile.name ?? '');
      setGrade(user?.profile.grade ?? '');
      setAvatarUrl(user?.profile.avatarUrl ?? '');
    }
  }, [user, isEditing]);

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
      setShowGoalForm(false);
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
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12 space-y-10">

        {/* HERO — avatar + identity + edit trigger */}
        <section className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="shrink-0 mx-auto sm:mx-0">
            {user?.profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profile.avatarUrl}
                alt="Avatar"
                className="h-24 w-24 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-foreground text-background flex items-center justify-center text-3xl font-semibold">
                {initialOf(user?.profile.name)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight truncate">
              {user?.profile.name || 'Chưa đặt tên'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {user?.email}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Tham gia từ {formatDate(user?.createdAt)}
            </p>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="self-center sm:self-start"
            >
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Chỉnh sửa
            </Button>
          )}
        </section>

        {/* PERSONAL INFO — edit form OR read-only rows */}
        {isEditing ? (
          <section className="rounded-2xl border border-border bg-card p-6 sm:p-7">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold tracking-tight">
                Chỉnh sửa thông tin
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleCancelEdit}
                disabled={savingProfile}
                aria-label="Hủy"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Avatar picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Ảnh đại diện</label>
                <div className="flex items-center gap-4">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="Avatar preview"
                      className="h-16 w-16 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xl font-semibold">
                      {initialOf(name)}
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
                      PNG/JPG, tối đa 5MB. Tự nén còn ~256px.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tên hiển thị</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  disabled={savingProfile}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <Input value={user?.email ?? ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Lớp / Khối</label>
                <Input
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="VD: 12A1, Lớp 10..."
                  disabled={savingProfile}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
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
          </section>
        ) : (
          <section className="rounded-2xl border border-border bg-card overflow-hidden">
            <InfoRow label="Tên hiển thị" value={user?.profile.name || '—'} />
            <Divider />
            <InfoRow label="Email" value={user?.email || '—'} />
            <Divider />
            <InfoRow label="Lớp / Khối" value={user?.profile.grade || '—'} />
          </section>
        )}

        {/* LEARNING GOALS */}
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Mục tiêu học tập
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Theo dõi cấp độ và thời hạn cho từng môn.
              </p>
            </div>
            {!showGoalForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGoalForm(true)}
                className="shrink-0"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Thêm
              </Button>
            )}
          </div>

          {goals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Chưa có mục tiêu nào.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {goals.map((g, idx) => {
                const isRemoving = removingGoalId === g.subjectId;
                return (
                  <div key={g.subjectId}>
                    {idx > 0 && <Divider />}
                    <div className="flex items-center justify-between px-5 py-4 gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {subjectName(g.subjectId)}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">
                            {levelLabels[g.targetLevel] ?? g.targetLevel}
                          </span>
                          {g.targetDate && (
                            <span>Hạn {formatDate(g.targetDate)}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveGoal(g.subjectId)}
                        disabled={isRemoving}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        aria-label="Xóa mục tiêu"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add-goal inline form */}
          {showGoalForm && (
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Thêm mục tiêu mới</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowGoalForm(false)}
                  aria-label="Đóng"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {subjectsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <form onSubmit={handleAddGoal} className="space-y-3">
                  <div className="space-y-1.5">
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
                  <div className="space-y-1.5">
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
                  <div className="space-y-1.5">
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
                  <div className="flex gap-2 pt-1">
                    <Button type="submit" size="sm" disabled={addingGoal}>
                      {addingGoal ? 'Đang thêm...' : 'Thêm mục tiêu'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowGoalForm(false)}
                      disabled={addingGoal}
                    >
                      Hủy
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </section>

        {/* ACCOUNT actions — iOS-settings-style rows */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Tài khoản</h2>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <Link
              href="/change-password"
              className="flex items-center justify-between px-5 py-4 hover:bg-accent transition-colors"
            >
              <span className="flex items-center gap-3">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Đổi mật khẩu</span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Divider />
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center px-5 py-4 hover:bg-accent transition-colors text-left"
            >
              <span className="flex items-center gap-3">
                <LogOut className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">
                  Đăng xuất
                </span>
              </span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

// Compact label/value row used in the read-only info section.
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right truncate max-w-[60%]">
        {value}
      </span>
    </div>
  );
}

// 1px hairline divider used between rows inside a card.
function Divider() {
  return <div className="h-px bg-border" />;
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileInner />
    </ProtectedRoute>
  );
}
