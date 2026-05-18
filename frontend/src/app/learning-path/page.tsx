'use client';

// Learning path list: view existing paths + form to create a new one.
// Requires a completed assessment to create a path.

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { assessmentApi, learningPathApi, subjectApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';
import type { AssessmentSummary, LearningPathSummary, Subject } from '@/lib/types';

const levelLabels: Record<string, string> = {
  basic: 'Cơ bản',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao',
};

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  active: { label: 'Đang học', variant: 'default' },
  completed: { label: 'Hoàn thành', variant: 'secondary' },
  paused: { label: 'Tạm dừng', variant: 'destructive' },
};

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN');
}

function LearningPathListInner() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [paths, setPaths] = useState<LearningPathSummary[]>([]);
  const [completedAssessments, setCompletedAssessments] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state — chọn môn trước, rồi tick 1-3 bài đánh giá thuộc môn đó.
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formAssessmentIds, setFormAssessmentIds] = useState<string[]>([]);
  const [formLevel, setFormLevel] = useState<'basic' | 'intermediate' | 'advanced'>('basic');
  const [formDate, setFormDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Đếm giây trôi qua kể từ lúc bấm "Tạo lộ trình" để user biết AI vẫn đang chạy.
  const [elapsed, setElapsed] = useState(0);
  const MAX_ASSESSMENTS = 3;

  useEffect(() => {
    if (!submitting) return;
    setElapsed(0);
    const start = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [submitting]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [subjectsData, pathsData, assessData] = await Promise.all([
          subjectApi.list(),
          learningPathApi.list().catch(() => [] as LearningPathSummary[]),
          assessmentApi.list({ status: 'completed' }).catch(() => [] as AssessmentSummary[]),
        ]);
        if (!active) return;
        setSubjects(subjectsData);
        setPaths(pathsData);
        setCompletedAssessments(assessData);
        // Mặc định chọn môn của bài đánh giá mới nhất.
        if (assessData.length > 0) setFormSubjectId(assessData[0].subjectId);
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const subjectName = (id: string) =>
    subjects.find((s) => s._id === id)?.name ?? id.slice(-6);

  // Các môn người dùng có bài đánh giá hoàn thành — dùng để render select.
  const availableSubjects = useMemo(() => {
    const ids = new Set(completedAssessments.map((a) => a.subjectId));
    return subjects.filter((s) => ids.has(s._id));
  }, [subjects, completedAssessments]);

  // Các bài đánh giá đã hoàn thành thuộc môn đang chọn.
  const subjectAssessments = useMemo(
    () => completedAssessments.filter((a) => a.subjectId === formSubjectId),
    [completedAssessments, formSubjectId],
  );

  // Reset danh sách bài đã tick khi đổi môn.
  useEffect(() => {
    setFormAssessmentIds([]);
  }, [formSubjectId]);

  const toggleAssessment = (id: string) => {
    setFormAssessmentIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_ASSESSMENTS) {
        toast.error(`Tối đa ${MAX_ASSESSMENTS} bài đánh giá.`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubjectId) { toast.error('Vui lòng chọn môn học.'); return; }
    if (formAssessmentIds.length === 0) {
      toast.error('Chọn từ 1 đến 3 bài đánh giá.');
      return;
    }
    if (!formDate) { toast.error('Vui lòng chọn ngày mục tiêu.'); return; }
    setSubmitting(true);
    try {
      const path = await learningPathApi.create({
        assessmentIds: formAssessmentIds,
        targetLevel: formLevel,
        targetDate: formDate,
      });
      toast.success('Tạo lộ trình thành công!');
      router.push(`/learning-path/${path._id}`);
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <section>
          <h1 className="text-2xl font-semibold">Lộ trình học</h1>
          <p className="text-sm text-muted-foreground">
            Xem các lộ trình đang có hoặc tạo lộ trình mới từ bài đánh giá.
          </p>
        </section>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Existing paths */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Lộ trình của bạn</h2>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : paths.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có lộ trình nào. Tạo lộ trình mới bên dưới.
            </p>
          ) : (
            <div className="space-y-2">
              {paths.map((p) => {
                const meta = statusLabels[p.status ?? ''] ?? { label: p.status ?? '—', variant: 'secondary' as const };
                const done = p.milestones?.filter((m) => m.completed).length ?? 0;
                const total = p.milestones?.length ?? 0;
                return (
                  <Card key={p._id}>
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{subjectName(p.subjectId)}</span>
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                          {p.targetLevel && (
                            <Badge variant="outline">{levelLabels[p.targetLevel] ?? p.targetLevel}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Ngày mục tiêu: {formatDate(p.targetDate)}
                          {' · '}
                          {done}/{total} milestone hoàn thành
                          {' · '}
                          Tạo: {formatDate(p.createdAt)}
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/learning-path/${p._id}`}>Xem chi tiết</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <Separator />

        {/* Create form */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Tạo lộ trình mới</h2>
          {!loading && completedAssessments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Bạn cần hoàn thành ít nhất một bài đánh giá để tạo lộ trình.{' '}
              <Link href="/assessment/new" className="underline">Bắt đầu đánh giá</Link>
            </p>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4 max-w-md">
              <div className="space-y-1">
                <label className="text-sm font-medium">Môn học</label>
                <select
                  value={formSubjectId}
                  onChange={(e) => setFormSubjectId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={loading || submitting}
                >
                  <option value="">-- Chọn môn --</option>
                  {availableSubjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Bài đánh giá (chọn 1-3 bài)
                </label>
                {!formSubjectId ? (
                  <p className="text-xs text-muted-foreground">
                    Chọn môn học để xem danh sách bài đánh giá.
                  </p>
                ) : subjectAssessments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Môn này chưa có bài đánh giá hoàn thành.
                  </p>
                ) : (
                  <div className="space-y-1 rounded-md border border-input p-2 max-h-48 overflow-y-auto">
                    {subjectAssessments.map((a) => {
                      const checked = formAssessmentIds.includes(a._id);
                      const disabled =
                        !checked && formAssessmentIds.length >= MAX_ASSESSMENTS;
                      return (
                        <label
                          key={a._id}
                          className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent ${
                            disabled ? 'opacity-50' : 'cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled || submitting}
                            onChange={() => toggleAssessment(a._id)}
                          />
                          <span className="flex-1 truncate">
                            {formatDate(a.completedAt ?? a.createdAt)}
                            {a.results ? ` · ${a.results.score}/100` : ''}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Đã chọn {formAssessmentIds.length}/{MAX_ASSESSMENTS}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Cấp độ mục tiêu</label>
                <select
                  value={formLevel}
                  onChange={(e) => setFormLevel(e.target.value as 'basic' | 'intermediate' | 'advanced')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={submitting}
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
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={submitting}
                />
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={submitting || loading}>
                  {submitting ? 'Đang tạo lộ trình...' : 'Tạo lộ trình'}
                </Button>
                {submitting && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {elapsed}s
                  </span>
                )}
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

export default function LearningPathListPage() {
  return (
    <ProtectedRoute>
      <LearningPathListInner />
    </ProtectedRoute>
  );
}
