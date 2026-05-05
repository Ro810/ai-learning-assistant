'use client';

// New assessment screen: pick subject + difficulty + count, then create.
// Reads ?subjectId=... query param if user came from dashboard subject card.

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { subjectApi, assessmentApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';
import type { Subject } from '@/lib/types';

function NewAssessmentInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialSubjectId = params.get('subjectId') ?? '';

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState(initialSubjectId);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(2);
  const [questionCount, setQuestionCount] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    subjectApi
      .list()
      .then((data) => {
        setSubjects(data);
        if (!subjectId && data.length > 0) setSubjectId(data[0]._id);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, [subjectId]);

  const handleStart = async () => {
    if (!subjectId) return;
    setError(null);
    setExistingId(null);
    setSubmitting(true);
    try {
      const assessment = await assessmentApi.create({
        subjectId,
        difficulty,
        questionCount,
      });
      router.push(`/assessment/${assessment._id}`);
    } catch (err: unknown) {
      // Backend returns 409 with { existingId } when user has unfinished assessment.
      const e = err as { response?: { status?: number; data?: { data?: { existingId?: string } } } };
      if (e?.response?.status === 409 && e.response.data?.data?.existingId) {
        setExistingId(e.response.data.data.existingId);
      }
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Bắt đầu bài đánh giá đầu vào</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Môn học</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                disabled={submitting}
              >
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Độ khó</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value) as 1 | 2 | 3)}
                disabled={submitting}
              >
                <option value={1}>Cơ bản</option>
                <option value={2}>Trung bình</option>
                <option value={3}>Nâng cao</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Số câu hỏi: {questionCount}
              </label>
              <input
                type="range"
                min={5}
                max={20}
                step={1}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full"
                disabled={submitting}
              />
            </div>

            {error && (
              <div className="space-y-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <p>{error}</p>
                {existingId && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/assessment/${existingId}`)}
                  >
                    Tiếp tục bài đang dở →
                  </Button>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button
                onClick={handleStart}
                disabled={submitting || !subjectId}
                className="flex-1"
              >
                {submitting ? 'AI đang sinh câu hỏi...' : 'Bắt đầu'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              AI sẽ sinh câu hỏi mới — có thể mất 5-15 giây.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function NewAssessmentPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="p-6 text-muted-foreground">Đang tải...</div>}>
        <NewAssessmentInner />
      </Suspense>
    </ProtectedRoute>
  );
}
