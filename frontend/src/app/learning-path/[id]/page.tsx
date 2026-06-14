'use client';

// Learning path detail: timeline of milestones with completion checkboxes.
// Allows marking milestones complete and deleting the path.

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Play } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { learningPathApi, practiceApi, subjectApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';
import { buildDayBounds, dayRangeLabel, computeWeekTasks } from '@/lib/learning-path-week';
import { FeedbackButtons } from '@/components/feedback-buttons';
import type { LearningPath, PracticeSessionSummary, Subject } from '@/lib/types';

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
  // Phiên luyện đang dở (in_progress) — để biết hiện "Bắt đầu" hay "Tiếp tục".
  const [inProgressSessions, setInProgressSessions] = useState<PracticeSessionSummary[]>([]);
  // Điểm chặng đã làm: milestoneId → điểm lần mới nhất (để hiện điểm + cho làm lại).
  const [milestoneScores, setMilestoneScores] = useState<Record<string, number>>({});
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
        // Load subject + practice sessions song song.
        const [sub, sessions] = await Promise.all([
          subjectApi.get(lp.subjectId).catch(() => null),
          practiceApi.list().catch(() => [] as PracticeSessionSummary[]),
        ]);
        if (!active) return;
        setSubject(sub);
        setInProgressSessions(
          sessions.filter(
            (s) => s.status === 'in_progress' && s.subjectId === lp.subjectId,
          ),
        );
        // Điểm chặng = phiên completed gắn milestoneId. List sort startedAt desc nên
        // bản ghi đầu tiên cho mỗi milestone là lần làm gần nhất.
        const scores: Record<string, number> = {};
        for (const s of sessions) {
          if (s.status !== 'completed' || !s.milestoneId) continue;
          if (s.milestoneId in scores) continue;
          if (typeof s.results?.score === 'number') scores[s.milestoneId] = s.results.score;
        }
        setMilestoneScores(scores);
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  // Tìm phiên dở có topicIds overlap với chặng — nếu có thì hiện "Tiếp tục".
  // Milestone không có topicIds (mock) → match bất kỳ phiên dở nào cùng subject.
  const findInProgressFor = (milestoneTopicIds: string[]): string | null => {
    if (inProgressSessions.length === 0) return null;
    if (milestoneTopicIds.length === 0) return inProgressSessions[0]._id;
    const setIds = new Set(milestoneTopicIds);
    const match = inProgressSessions.find((s) =>
      (s.topicIds ?? []).some((t) => setIds.has(t)),
    );
    return match?._id ?? null;
  };

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
  // Khoảng ngày tích lũy cho từng chặng — hiển thị "Ngày X–Y" theo thứ tự lộ trình.
  const dayBounds = buildDayBounds(path.milestones);
  // "Việc tuần này" — cửa sổ 7 ngày kể từ hôm nay (logic dùng chung với Dashboard).
  const { todayNum, weekEnd, items: weekItems, overdueCount, allDone } =
    computeWeekTasks(path);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/learning-path')}
            className="-ml-2 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại
          </Button>
        </div>

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
                {completedCount}/{path.milestones.length} chặng hoàn thành
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

        {/* Đánh giá chất lượng lộ trình do AI sinh */}
        <FeedbackButtons targetType="learning_path" targetId={path._id} label="Lộ trình này:" />

        {/* Việc tuần này — gom các chặng cần học trong 7 ngày tới */}
        {path.milestones.length > 0 && (
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Việc tuần này (Ngày {todayNum}–{weekEnd})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {allDone ? (
                <p className="text-sm text-muted-foreground">
                  Bạn đã hoàn thành tất cả chặng của lộ trình. 🎉
                </p>
              ) : weekItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Không có chặng nào trong tuần này.
                  {overdueCount > 0 && ` Bạn còn ${overdueCount} chặng trễ lịch — nên học sớm.`}
                </p>
              ) : (
                <>
                  <ul className="space-y-1.5">
                    {weekItems.map(({ idx, bound }) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="shrink-0 font-medium">
                          {dayRangeLabel(bound)}
                        </Badge>
                        <Link
                          href={`/learning-path/${id}/study?m=${idx}`}
                          className="truncate text-primary hover:underline"
                        >
                          {path.milestones[idx].title || `Chặng ${idx + 1}`}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {overdueCount > 0 && (
                    <p className="text-xs text-amber-600">
                      Ngoài ra còn {overdueCount} chặng trễ lịch chưa hoàn thành.
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Milestones timeline */}
        {path.milestones.length === 0 ? (
          <p className="text-sm text-muted-foreground">Lộ trình này chưa có chặng nào.</p>
        ) : (
          <div className="space-y-4">
            {path.milestones.map((m, idx) => {
              const diff = difficultyLabels[m.difficulty] ?? { label: `Độ khó ${m.difficulty}`, variant: 'secondary' as const };
              const isUpdating = updatingIdx === idx;
              const done = isMilestoneDone(m);
              return (() => {
                  const resumeId = findInProgressFor(m.topicIds);
                  // Có phiên dở → tiếp tục thẳng; chưa có → mở màn học nội dung của chặng.
                  const href = resumeId
                    ? `/practice/${resumeId}`
                    : `/learning-path/${id}/study?m=${idx}`;
                  // Điểm chặng đã làm (lần gần nhất) — nếu có thì nút thành "Làm lại".
                  const score = m._id ? milestoneScores[m._id] : undefined;
                  const hasScore = typeof score === 'number';
                  // Khi không có topics + resources → ẩn CardContent để card gọn.
                  const hasExtraContent = m.topicIds.length > 0 || m.resources.length > 0;
                  return (
                    <Card
                      key={m._id ?? idx}
                      // Card root mặc định py-6 (12px+12px) → khi không có CardContent,
                      // override py-3 để card co lại & header tự cân giữa.
                      className={`${done ? 'opacity-70 ' : ''}${
                        hasExtraContent ? '' : 'py-3'
                      }`}
                    >
                      <CardHeader className={hasExtraContent ? 'pb-2' : ''}>
                        <div className="flex items-start justify-between gap-4">
                          {/* Trái: tiêu đề + metadata (độ khó, số ngày) gom thành 1 cụm */}
                          <div className="min-w-0 space-y-1.5">
                            <CardTitle className="text-lg leading-snug">
                              {m.title || `Chặng ${idx + 1}`}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="font-medium">
                                {dayRangeLabel(dayBounds[idx])}
                              </Badge>
                              <Badge variant={diff.variant}>{diff.label}</Badge>
                              <span className="text-xs text-muted-foreground">
                                ~{m.estimatedDays} ngày
                              </span>
                              {hasScore && (
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100"
                                >
                                  Điểm: {score}/100
                                </Badge>
                              )}
                            </div>
                          </div>
                          {/* Phải: nút hành động + checkbox, không co lại khi title dài */}
                          <div className="flex shrink-0 items-center gap-2">
                            <Button asChild size="sm" className="gap-1.5 h-8">
                              <Link href={href}>
                                <Play className="h-3.5 w-3.5" />
                                {resumeId ? 'Tiếp tục' : hasScore ? 'Làm lại' : 'Bắt đầu'}
                              </Link>
                            </Button>
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
                      {hasExtraContent && (
                        <CardContent className="space-y-3 border-t pt-3 pb-4">
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
                      )}
                    </Card>
                  );
                })();
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
