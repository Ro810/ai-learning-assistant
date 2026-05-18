'use client';

// Result page: shows score, skill breakdown by topic, recommended level,
// and per-question review (correct answer + explanation).

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { assessmentApi, subjectApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';
import type { Assessment, Subject } from '@/lib/types';

function ResultInner({ id }: { id: string }) {
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    assessmentApi
      .get(id)
      .then(async (data) => {
        if (!active) return;
        if (data.status !== 'completed') {
          // Not completed → bounce back to take page (or dashboard if abandoned).
          router.replace(
            data.status === 'in_progress' ? `/assessment/${id}` : '/dashboard',
          );
          return;
        }
        setAssessment(data);
        try {
          const s = await subjectApi.get(data.subjectId);
          if (active) setSubject(s);
        } catch {
          /* subject lookup is best-effort for topic name display */
        }
      })
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Đang tải kết quả...
      </div>
    );
  }

  if (error || !assessment?.results) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-2xl p-6">
          <p className="text-sm text-destructive">{error ?? 'Không có kết quả.'}</p>
          <Button className="mt-3" onClick={() => router.push('/dashboard')}>
            Về Dashboard
          </Button>
        </main>
      </div>
    );
  }

  const { score, correctCount, totalQuestions, skillAnalysis } = assessment.results;

  const topicName = (topicId: string) =>
    subject?.topics.find((t) => t._id === topicId)?.name ?? topicId.slice(-6);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Kết quả bài đánh giá</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-baseline gap-4">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Điểm</p>
                <p className="text-4xl font-bold">{score}/100</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Đúng</p>
                <p className="text-2xl font-semibold">
                  {correctCount}/{totalQuestions}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="mb-2 text-sm font-semibold">Phân tích theo chủ đề</h3>
              <div className="space-y-2">
                {skillAnalysis.map((sa) => {
                  const pct = sa.total > 0 ? Math.round((sa.correct / sa.total) * 100) : 0;
                  return (
                    <div key={sa.topicId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{topicName(sa.topicId)}</span>
                        <span className="text-muted-foreground">
                          {sa.correct}/{sa.total} · {sa.level}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Xem lại từng câu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assessment.questions.map((q, idx) => {
              const correct = q.questionSnapshot.content.correctAnswer;
              return (
                <div key={q.questionId} className="space-y-2 border-b pb-3 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">
                      Câu {idx + 1}. {q.questionSnapshot.content.questionText}
                    </p>
                    <Badge variant={q.isCorrect ? 'default' : 'destructive'}>
                      {q.isCorrect ? 'Đúng' : 'Sai'}
                    </Badge>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {q.questionSnapshot.content.options.map((opt) => {
                      const isCorrect = opt.id === correct;
                      const isUser = opt.id === q.userAnswer;
                      return (
                        <li
                          key={opt.id}
                          className={`rounded px-2 py-1 ${
                            isCorrect
                              ? 'bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100'
                              : isUser
                                ? 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100'
                                : ''
                          }`}
                        >
                          <span className="mr-1 font-semibold">{opt.id.toUpperCase()}.</span>
                          {opt.text}
                          {isCorrect && ' ✓'}
                          {isUser && !isCorrect && ' (chọn)'}
                        </li>
                      );
                    })}
                  </ul>
                  {q.questionSnapshot.content.explanation && (
                    <p className="text-xs text-muted-foreground">
                      <strong>Giải thích:</strong> {q.questionSnapshot.content.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">Về Dashboard</Link>
          </Button>
          <Button asChild>
            <Link href={`/assessment/new?subjectId=${assessment.subjectId}`}>
              Làm bài mới
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ProtectedRoute>
      <ResultInner id={id} />
    </ProtectedRoute>
  );
}
