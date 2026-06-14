'use client';

// Màn học nội dung của 1 chặng trong lộ trình.
// Mở từ nút "Bắt đầu" ở trang chi tiết lộ trình (?m=<index chặng>).
// LEFT  — sidebar các chủ đề thuộc chặng.
// RIGHT — tóm tắt kiến thức chủ đề đang chọn + tài nguyên + nút luyện tập đúng
//         các chủ đề của chặng (tạo practice session → /practice/[id]).

import { Suspense, use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Play, ChevronRight } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { learningPathApi, practiceApi, subjectApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';
import { topicIcon } from '@/lib/topic-icon';
import type { LearningPath, Subject, Topic } from '@/lib/types';

const diffLabels: Record<number, string> = { 1: 'Dễ', 2: 'Trung bình', 3: 'Khó' };

function MilestoneStudyInner({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mIdx = Math.max(0, Number(searchParams.get('m') ?? 0) || 0);

  const [path, setPath] = useState<LearningPath | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [starting, setStarting] = useState(false);
  const [startErr, setStartErr] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);
  // Đếm số giây trôi qua khi đang sinh câu hỏi luyện tập.
  const [elapsed, setElapsed] = useState(0);

  // Bật/tắt đồng hồ theo trạng thái starting; reset về 0 khi dừng.
  useEffect(() => {
    if (!starting) {
      setElapsed(0);
      return;
    }
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [starting]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const lp = await learningPathApi.get(id);
        if (!active) return;
        setPath(lp);
        const sub = await subjectApi.get(lp.subjectId).catch(() => null);
        if (!active) return;
        setSubject(sub);
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-4xl px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  const milestone = path?.milestones[mIdx];
  if (error || !path || !milestone) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-4xl p-6">
          <p className="text-sm text-destructive">{error ?? 'Không tìm thấy chặng này.'}</p>
          <Button className="mt-3" onClick={() => router.push(`/learning-path/${id}`)}>
            Về lộ trình
          </Button>
        </main>
      </div>
    );
  }

  // Khoảng ngày tích lũy của chặng đang xem: cộng dồn estimatedDays các chặng trước.
  const dayOffset = path.milestones
    .slice(0, mIdx)
    .reduce((sum, m) => sum + Math.max(1, m.estimatedDays || 1), 0);
  const daySpan = Math.max(1, milestone.estimatedDays || 1);
  const dayStart = dayOffset + 1;
  const dayEnd = dayOffset + daySpan;
  const dayRangeLabel = dayStart === dayEnd ? `Ngày ${dayStart}` : `Ngày ${dayStart}–${dayEnd}`;

  // Topics của chặng — lọc từ subject theo topicIds, giữ thứ tự subject.
  const topics: Topic[] = (subject?.topics ?? []).filter((t) =>
    milestone.topicIds.includes(t._id),
  );
  const selected = topics[Math.min(selectedIdx, Math.max(0, topics.length - 1))];
  const summaryLines =
    selected?.summary?.split('\n').map((s) => s.trim()).filter(Boolean) ?? [];

  const handleStartPractice = async () => {
    setStartErr(null);
    setExistingId(null);
    setStarting(true);
    try {
      const session = await practiceApi.create({
        subjectId: path.subjectId,
        topicIds: milestone.topicIds.length > 0 ? milestone.topicIds : undefined,
        mode: 'adaptive',
        questionCount: 10,
        // Gắn chặng → hiện tên chặng ở màn luyện tập + tự tick hoàn thành khi xong.
        learningPathId: path._id,
        milestoneId: milestone._id,
        label: milestone.title,
      });
      toast.success('Đã tạo phiên luyện tập!');
      router.push(`/practice/${session._id}`);
    } catch (err: unknown) {
      const e = err as {
        response?: { status?: number; data?: { data?: { existingId?: string } } };
      };
      // 409 — đã có phiên đang dở; cho user tiếp tục thay vì tạo mới.
      if (e?.response?.status === 409 && e.response.data?.data?.existingId) {
        setExistingId(e.response.data.data.existingId);
      }
      setStartErr(getErrorMessage(err));
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/learning-path/${id}`)}
          className="-ml-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Quay lại lộ trình
        </Button>

        {/* Tiêu đề chặng + meta */}
        <section>
          <h1 className="text-2xl font-semibold tracking-tight">{milestone.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline" className="font-medium">{dayRangeLabel}</Badge>
            <Badge variant="secondary">{diffLabels[milestone.difficulty] ?? `Độ khó ${milestone.difficulty}`}</Badge>
            <span className="text-sm text-muted-foreground">~{milestone.estimatedDays} ngày</span>
          </div>
        </section>

        {topics.length === 0 ? (
          // Chặng không gắn chủ đề (vd path mock) — vẫn cho luyện tập cả môn.
          <p className="text-sm text-muted-foreground">
            Chặng này chưa gắn chủ đề cụ thể. Bạn vẫn có thể luyện tập tổng quát môn học.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-4">
            <aside className="rounded-2xl border border-border bg-card p-2 self-start">
              <p className="text-xs font-semibold text-muted-foreground px-2 py-2">
                Chủ đề trong chặng
              </p>
              <ul className="space-y-0.5">
                {topics.map((topic, idx) => {
                  const Icon = topicIcon(topic.name);
                  const active = idx === selectedIdx;
                  return (
                    <li key={topic._id}>
                      <button
                        type="button"
                        onClick={() => setSelectedIdx(idx)}
                        className={`w-full text-left flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors ${
                          active
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 truncate">{topic.name}</span>
                        {active && <ChevronRight className="h-4 w-4 shrink-0" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">{selected?.name}</h2>
                {selected?.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
                )}
              </div>

              {summaryLines.length > 0 ? (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold mb-3">Tóm tắt kiến thức</h3>
                  <ul className="space-y-2 list-disc pl-5 text-sm text-foreground/90">
                    {summaryLines.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chủ đề này chưa có tóm tắt kiến thức.
                </p>
              )}
            </section>
          </div>
        )}

        {/* Tài nguyên của chặng */}
        {milestone.resources.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">Tài nguyên gợi ý</h3>
            <ul className="space-y-1.5">
              {milestone.resources.map((r, ri) => {
                const label = `[${r.type}] ${r.title}`;
                return (
                  <li key={ri} className="text-sm">
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
                      <span className="text-foreground/90">{label}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Lỗi tạo phiên (vd hết quota Gemini) + lối tiếp tục bài dở */}
        {startErr && (
          <div className="space-y-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <p>{startErr}</p>
            {existingId && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => router.push(`/practice/${existingId}`)}
              >
                Tiếp tục bài đang dở →
              </Button>
            )}
          </div>
        )}

        {/* Nút luyện tập đúng các chủ đề của chặng */}
        <div className="flex justify-end">
          <Button onClick={handleStartPractice} disabled={starting} size="lg" className="gap-2">
            <Play className="h-4 w-4" />
            {starting ? `Đang sinh câu hỏi... ${elapsed}s` : 'Luyện tập chặng này'}
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function MilestoneStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center text-muted-foreground">
            Đang tải...
          </div>
        }
      >
        <MilestoneStudyInner id={id} />
      </Suspense>
    </ProtectedRoute>
  );
}
