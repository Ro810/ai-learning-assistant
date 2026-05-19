'use client';

// New assessment screen: pick subject + difficulty + count, then create.
// Reads ?subjectId, ?topicId, ?topicName, ?packId, ?questionCount query params.
// Pack mode (packId present): hides difficulty + count controls, starts instantly.

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
  // Pre-scoped topic (came from subject detail or pack part click).
  const presetTopicId = params.get('topicId') ?? '';
  const presetTopicName = params.get('topicName') ?? '';
  // Pack mode params — when set, backend skips AI and uses pre-seeded questions.
  const presetPackId = params.get('packId') ?? '';
  const presetQuestionCount = Number(params.get('questionCount')) || 0;

  const isPackMode = Boolean(presetPackId);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState(initialSubjectId);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(2);
  const [questionCount, setQuestionCount] = useState(
    presetQuestionCount > 0 ? presetQuestionCount : 10,
  );
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

  // Sync questionCount when preset arrives after mount (edge case: params late).
  useEffect(() => {
    if (presetQuestionCount > 0) setQuestionCount(presetQuestionCount);
  }, [presetQuestionCount]);

  const handleStart = async () => {
    if (!subjectId) return;
    setError(null);
    setExistingId(null);
    setSubmitting(true);
    try {
      const assessment = await assessmentApi.create({
        subjectId,
        ...(presetTopicId ? { topicIds: [presetTopicId] } : {}),
        ...(isPackMode
          ? { packId: presetPackId, questionCount }
          : { difficulty, questionCount }),
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
            <CardTitle>
              {presetTopicName
                ? `Bài test: ${presetTopicName}`
                : 'Bắt đầu bài đánh giá đầu vào'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Subject selector — hidden when topic is pre-scoped */}
            {presetTopicId ? (
              <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                <div className="text-xs text-muted-foreground">Kỹ năng / chủ đề</div>
                <div className="font-medium">{presetTopicName ?? 'Đang tải...'}</div>
              </div>
            ) : (
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
            )}

            {/* Difficulty selector — hidden in pack mode */}
            {!isPackMode && (
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
            )}

            {/* Question count slider — hidden in pack mode (fixed per part) */}
            {!isPackMode && (
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
            )}

            {/* Pack mode info strip */}
            {isPackMode && (
              <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                <div className="text-xs text-muted-foreground">Số câu</div>
                <div className="font-medium">{questionCount} câu</div>
              </div>
            )}

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
                onClick={() => router.back()}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button
                onClick={handleStart}
                disabled={submitting || !subjectId}
                className="flex-1"
              >
                {submitting ? 'Đang tải...' : 'Bắt đầu'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              {isPackMode
                ? 'Câu hỏi đã được chuẩn bị sẵn — bắt đầu ngay.'
                : 'AI sẽ sinh câu hỏi mới — có thể mất 5-15 giây.'}
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
