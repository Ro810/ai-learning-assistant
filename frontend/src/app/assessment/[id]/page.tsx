'use client';

// Take-assessment screen. Loads assessment by id, shows one question at a
// time with multiple-choice options, collects answers, submits at the end.
// If assessment is already completed, redirects to /result.

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { assessmentApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';
import type { Assessment } from '@/lib/types';

function TakeAssessmentInner({ id }: { id: string }) {
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    assessmentApi
      .get(id)
      .then((data) => {
        if (!active) return;
        if (data.status === 'completed') {
          router.replace(`/assessment/${id}/result`);
          return;
        }
        if (data.status === 'abandoned') {
          setError('Bài đánh giá này đã bị hủy.');
          setAssessment(data);
          return;
        }
        setAssessment(data);
      })
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, router]);

  const questions = assessment?.questions ?? [];
  const currentQ = questions[currentIdx];
  const answeredCount = useMemo(
    () => Object.keys(answers).length,
    [answers],
  );

  // Browser-level warning when user tries to close/refresh while having
  // unsubmitted answers. Internal nav still allowed (in_progress saved
  // server-side, can resume from dashboard).
  useEffect(() => {
    if (answeredCount === 0 || submitting) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [answeredCount, submitting]);

  const handleSelect = (optionId: string) => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (!assessment) return;
    if (answeredCount < questions.length) {
      const skipped = questions.length - answeredCount;
      const ok = confirm(
        `Bạn còn ${skipped} câu chưa trả lời. Vẫn nộp bài?`,
      );
      if (!ok) return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = questions.map((q) => ({
        questionId: q.questionId,
        answer: answers[q.questionId] ?? '',
      }));
      await assessmentApi.submit(assessment._id, payload);
      toast.success('Đã nộp bài, đang chấm...');
      router.replace(`/assessment/${assessment._id}/result`);
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
      setSubmitting(false);
    }
  };

  const handleAbandon = async () => {
    if (!assessment) return;
    if (!confirm('Hủy bài này? Bạn sẽ không thể tiếp tục sau khi hủy.')) return;
    try {
      await assessmentApi.abandon(assessment._id);
      toast.info('Đã hủy bài đánh giá.');
      router.push('/dashboard');
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Đang tải bài...
      </div>
    );
  }

  if (!assessment || !currentQ) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-2xl p-6">
          <p className="text-sm text-destructive">{error ?? 'Không tải được bài đánh giá.'}</p>
          <Button className="mt-3" onClick={() => router.push('/dashboard')}>
            Về Dashboard
          </Button>
        </main>
      </div>
    );
  }

  const total = questions.length;
  const isLast = currentIdx === total - 1;
  const selected = answers[currentQ.questionId];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span>
            Câu <strong>{currentIdx + 1}</strong> / {total}
          </span>
          <span className="text-muted-foreground">Đã trả lời: {answeredCount}/{total}</span>
        </div>

        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${((currentIdx + 1) / total) * 100}%` }}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base leading-relaxed">
              {currentQ.questionSnapshot.content.questionText}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {currentQ.questionSnapshot.content.options.map((opt) => {
              const active = selected === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full rounded-md border px-4 py-3 text-left text-sm transition-colors ${
                    active
                      ? 'border-primary bg-primary/10'
                      : 'border-input hover:bg-accent'
                  }`}
                >
                  <span className="mr-2 font-semibold">{opt.id.toUpperCase()}.</span>
                  {opt.text}
                </button>
              );
            })}
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0 || submitting}
          >
            ← Câu trước
          </Button>

          <Button variant="ghost" onClick={handleAbandon} disabled={submitting}>
            Hủy bài
          </Button>

          {isLast ? (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Đang chấm...' : 'Nộp bài'}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentIdx((i) => Math.min(total - 1, i + 1))}
              disabled={submitting}
            >
              Câu tiếp →
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

export default function TakeAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Next.js 15+: params is a Promise — unwrap with React.use().
  const { id } = use(params);
  return (
    <ProtectedRoute>
      <TakeAssessmentInner id={id} />
    </ProtectedRoute>
  );
}
