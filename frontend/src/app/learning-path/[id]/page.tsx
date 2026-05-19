'use client';

// Learning path detail: timeline of milestones with completion checkboxes.
// Allows marking milestones complete and deleting the path.

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { learningPathApi, subjectApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';
import type { LearningPath, Subject } from '@/lib/types';

const difficultyLabels: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  1: { label: 'Dễ', variant: 'secondary' },
  2: { label: 'Trung bình', variant: 'default' },
  3: { label: 'Khó', variant: 'destructive' },
};

const levelLabels: Record<string, string> = {
  basic: 'Cơ bản',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao',
};

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN');
}

function LearningPathDetailInner({ id }: { id: string }) {
  const router = useRouter();
  const [path, setPath] = useState<LearningPath | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingIdx, setUpdatingIdx] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const lp = await learningPathApi.get(id);
        if (!active) return;
        setPath(lp);
        // Load subject to resolve topic names
        const sub = await subjectApi.get(lp.subjectId).catch(() => null);
        if (active) setSubject(sub);
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const topicName = (topicId: string) =>
    subject?.topics.find((t) => t._id === topicId)?.name ?? topicId.slice(-6);

  const handleToggleMilestone = async (
    idx: number,
    milestoneId: string,
    currentDone: boolean,
  ) => {
    if (!path || updatingIdx !== null) return;
    setUpdatingIdx(idx);
    try {
      const updated = await learningPathApi.update(id, {
        milestoneId,
        action: currentDone ? 'uncomplete' : 'complete',
      });
      setPath(updated);
      toast.success(!currentDone ? 'Đã đánh dấu hoàn thành!' : 'Đã bỏ đánh dấu.');
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
    } finally {
      setUpdatingIdx(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Xóa lộ trình này? Hành động không thể hoàn tác.')) return;
    setDeleting(true);
    try {
      await learningPathApi.delete(id);
      toast.success('Đã xóa lộ trình.');
      router.push('/learning-path');
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </main>
      </div>
    );
  }

  if (error || !path) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-3xl p-6">
          <p className="text-sm text-destructive">{error ?? 'Không tải được lộ trình.'}</p>
          <Button className="mt-3" onClick={() => router.push('/learning-path')}>
            Về danh sách lộ trình
          </Button>
        </main>
      </div>
    );
  }

  const isMilestoneDone = (m: { completedAt?: string | null; completionRate?: number }) =>
    Boolean(m.completedAt) || m.completionRate === 100;
  const completedCount = path.milestones.filter(isMilestoneDone).length;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {/* Header info */}
        <section className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">
              {subject?.name ?? path.subjectId.slice(-6)}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="outline">{levelLabels[path.targetLevel] ?? path.targetLevel}</Badge>
              <span className="text-sm text-muted-foreground">
                Mục tiêu: {formatDate(path.targetDate)}
              </span>
              <span className="text-sm text-muted-foreground">
                {completedCount}/{path.milestones.length} milestone hoàn thành
              </span>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Đang xóa...' : 'Xóa lộ trình'}
          </Button>
        </section>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Tiến độ</span>
            <span>{path.milestones.length > 0
              ? Math.round((completedCount / path.milestones.length) * 100)
              : 0}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{
                width: path.milestones.length > 0
                  ? `${(completedCount / path.milestones.length) * 100}%`
                  : '0%',
              }}
            />
          </div>
        </div>

        {/* Milestones timeline */}
        {path.milestones.length === 0 ? (
          <p className="text-sm text-muted-foreground">Lộ trình này chưa có milestone nào.</p>
        ) : (
          <div className="space-y-4">
            {path.milestones.map((m, idx) => {
              const diff = difficultyLabels[m.difficulty] ?? { label: `Độ khó ${m.difficulty}`, variant: 'secondary' as const };
              const isUpdating = updatingIdx === idx;
              const done = isMilestoneDone(m);
              return (
                <Card key={m._id ?? idx} className={done ? 'opacity-70' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-base">
                        {m.title || `Tuần ${idx + 1}`}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={diff.variant}>{diff.label}</Badge>
                        <span className="text-xs text-muted-foreground">
                          ~{m.estimatedDays} ngày
                        </span>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleToggleMilestone(idx, m._id, done)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            done
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-input hover:border-primary'
                          } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          aria-label={done ? 'Bỏ hoàn thành' : 'Đánh dấu hoàn thành'}
                        >
                          {done && (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {/* Topics */}
                    {m.topicIds.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Chủ đề:</p>
                        <div className="flex flex-wrap gap-1">
                          {m.topicIds.map((tid) => (
                            <Badge key={tid} variant="secondary" className="text-xs">
                              {topicName(tid)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Resources — object { type, title, url } */}
                    {m.resources.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Tài nguyên:</p>
                        <ul className="space-y-1">
                          {m.resources.map((r, ri) => {
                            const label = `[${r.type}] ${r.title}`;
                            return (
                              <li key={ri} className="text-xs">
                                {r.url ? (
                                  <a
                                    href={r.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary underline"
                                  >
                                    {label}
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground">{label}</span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function LearningPathDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ProtectedRoute>
      <LearningPathDetailInner id={id} />
    </ProtectedRoute>
  );
}
