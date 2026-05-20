'use client';

// Create a new practice session: select subject, topics, mode, question count.
// Pre-fills topicIds/mode from query string when coming from /weakness page.

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { practiceApi, subjectApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';
import type { Subject } from '@/lib/types';

const QUESTION_COUNTS = [5, 10, 15, 20] as const;

function NewPracticeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [subjectId, setSubjectId] = useState('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [mode, setMode] = useState<'adaptive' | 'exam_simulation'>('adaptive');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    subjectApi
      .list({ withTopics: true })
      .then((data) => {
        if (!active) return;
        setSubjects(data);
        if (data.length > 0) {
          setSubjectId(data[0]._id);
        }
        // Pre-fill from query string (coming from /weakness)
        const qMode = searchParams.get('mode');
        if (qMode === 'adaptive' || qMode === 'exam_simulation') {
          setMode(qMode);
        }
        const qTopics = searchParams.get('topicIds');
        if (qTopics) {
          setSelectedTopicIds(qTopics.split(',').filter(Boolean));
        }
      })
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [searchParams]);

  const currentSubject = subjects.find((s) => s._id === subjectId) ?? null;

  // When subject changes, clear topic selection unless pre-filled from URL
  const handleSubjectChange = (id: string) => {
    setSubjectId(id);
    setSelectedTopicIds([]);
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId) ? prev.filter((t) => t !== topicId) : [...prev, topicId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) { toast.error('Vui lòng chọn môn học.'); return; }
    setSubmitting(true);
    try {
      const session = await practiceApi.create({
        subjectId,
        topicIds: selectedTopicIds.length > 0 ? selectedTopicIds : undefined,
        mode,
        questionCount,
      });
      toast.success('Đã tạo phiên luyện tập!');
      router.push(`/practice/${session._id}`);
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <section>
          <h1 className="text-2xl font-semibold">Tạo phiên luyện tập</h1>
          <p className="text-sm text-muted-foreground">
            Chọn môn, chủ đề, chế độ và số câu hỏi để bắt đầu.
          </p>
        </section>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Subject */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Môn học</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={subjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={submitting}
                >
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {/* Topics */}
            {currentSubject && (currentSubject.topics?.length ?? 0) > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Chủ đề
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      (không chọn = tất cả chủ đề)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {currentSubject.topics.map((t) => (
                      <label
                        key={t._id}
                        className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ${
                          selectedTopicIds.includes(t._id)
                            ? 'border-primary bg-primary/10'
                            : 'border-input hover:bg-accent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="accent-primary"
                          checked={selectedTopicIds.includes(t._id)}
                          onChange={() => toggleTopic(t._id)}
                          disabled={submitting}
                        />
                        {t.name}
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mode */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Chế độ luyện tập</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(
                  [
                    {
                      value: 'adaptive',
                      label: 'Thích nghi (Adaptive)',
                      desc: 'Độ khó tự điều chỉnh theo kết quả của bạn.',
                    },
                    {
                      value: 'exam_simulation',
                      label: 'Mô phỏng thi (Exam Simulation)',
                      desc: 'Câu hỏi cố định như bài thi thật.',
                    },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors ${
                      mode === opt.value
                        ? 'border-primary bg-primary/10'
                        : 'border-input hover:bg-accent'
                    }`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      value={opt.value}
                      checked={mode === opt.value}
                      onChange={() => setMode(opt.value)}
                      disabled={submitting}
                      className="mt-0.5 accent-primary"
                    />
                    <div>
                      <p className="font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </CardContent>
            </Card>

            {/* Question count */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Số câu hỏi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {QUESTION_COUNTS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setQuestionCount(n)}
                      disabled={submitting}
                      className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                        questionCount === n
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input hover:bg-accent'
                      }`}
                    >
                      {n} câu
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button type="submit" disabled={submitting || !subjectId} className="w-full">
              {submitting ? 'Đang tạo...' : 'Bắt đầu luyện tập'}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}

function NewPracticePageWithSuspense() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Đang tải...
        </div>
      }
    >
      <NewPracticeInner />
    </Suspense>
  );
}

export default function NewPracticePage() {
  return (
    <ProtectedRoute>
      <NewPracticePageWithSuspense />
    </ProtectedRoute>
  );
}
