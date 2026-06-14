'use client';

// Practice session screen. Handles 3 states:
//   in_progress → active quiz UI with adaptive controls
//   completed   → results + per-question review
//   abandoned   → informational message

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { practiceApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';
import { QuestionContent } from '@/components/question-content';
import { FeedbackButtons } from '@/components/feedback-buttons';
import { AskAiButton } from '@/components/ask-ai-button';
import type { PracticeSession, PracticeQuestion } from '@/lib/types';

const difficultyLabels: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  1: { label: 'Dễ', variant: 'secondary' },
  2: { label: 'Trung bình', variant: 'default' },
  3: { label: 'Khó', variant: 'destructive' },
};

// Find the first unanswered question index.
function findCurrentQuestionIdx(questions: PracticeQuestion[]): number {
  const idx = questions.findIndex((q) => q.userAnswer == null);
  return idx === -1 ? questions.length - 1 : idx;
}

// ----- Completed results view -----

function ResultsView({ session }: { session: PracticeSession }) {
  const r = session.results;
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-semibold mb-3">Kết quả luyện tập</h2>
        {r ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Điểm', value: `${r.score}/100` },
              { label: 'Độ chính xác', value: `${Math.round(r.accuracy * 100)}%` },
              { label: 'Đúng / Tổng', value: `${r.totalCorrect}/${r.totalQuestions}` },
              { label: 'TG TB/câu', value: `${r.avgTimePerQuestion.toFixed(1)}s` },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Không có dữ liệu kết quả.</p>
        )}
      </section>

      <Separator />

      <section>
        <h2 className="text-lg font-semibold mb-3">Chi tiết từng câu</h2>
        <div className="space-y-3">
          {session.questions.map((q, idx) => {
            const content = q.questionSnapshot.content;
            const correct = q.isCorrect;
            return (
              <Card key={q.questionId} className={correct ? 'border-green-500/40' : 'border-destructive/40'}>
                <CardHeader className="pb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Câu {idx + 1}</span>
                    <Badge variant={correct ? 'secondary' : 'destructive'}>
                      {correct ? 'Đúng' : 'Sai'}
                    </Badge>
                  </div>
                  <QuestionContent text={content.questionText} className="text-sm leading-relaxed" />
                </CardHeader>
                <CardContent className="space-y-1">
                  {content.options.map((opt) => {
                    const isUserAnswer = opt.id === q.userAnswer;
                    const isCorrectAnswer = opt.id === content.correctAnswer;
                    let cls = 'rounded-md border px-3 py-2 text-sm';
                    if (isCorrectAnswer) cls += ' border-green-500 bg-green-500/10';
                    else if (isUserAnswer && !correct) cls += ' border-destructive bg-destructive/10';
                    else cls += ' border-input';
                    return (
                      <div key={opt.id} className={cls}>
                        <span className="mr-2 font-semibold">{opt.id.toUpperCase()}.</span>
                        <QuestionContent text={opt.text} className="inline" />
                        {isUserAnswer && !isCorrectAnswer && (
                          <span className="ml-2 text-xs text-destructive">(Bạn chọn)</span>
                        )}
                        {isCorrectAnswer && (
                          <span className="ml-2 text-xs text-green-600">(Đáp án đúng)</span>
                        )}
                      </div>
                    );
                  })}
                  {content.explanation && (
                    <p className="text-xs text-muted-foreground pt-1">
                      <span className="font-medium">Giải thích:</span> {content.explanation}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <FeedbackButtons targetType="question" targetId={q.questionId} label="Câu hỏi này:" />
                    <AskAiButton question={content} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ----- Active session UI -----

function ActiveSessionView({
  session,
  onAnswer,
  onFinish,
  onAbandon,
}: {
  session: PracticeSession;
  onAnswer: (questionId: string, answer: string, timeSpentSeconds: number) => Promise<void>;
  onFinish: () => Promise<void>;
  onAbandon: () => Promise<void>;
}) {
  const questions = session.questions;
  const allAnswered = questions.length > 0 && questions.every((q) => q.userAnswer != null);
  const currentIdx = findCurrentQuestionIdx(questions);
  // Khi đã trả lời hết → không hiện câu nào nữa (để rơi vào màn "đã xong" bên dưới).
  const currentQ = allAnswered ? undefined : questions[currentIdx];
  const [selected, setSelected] = useState<string>('');
  const [answering, setAnswering] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [abandoning, setAbandoning] = useState(false);
  // Mốc thời gian bắt đầu câu hiện tại — để đo thời gian làm mỗi câu.
  const questionStartRef = useRef<number>(Date.now());

  // Reset lựa chọn + mốc thời gian mỗi khi đổi câu.
  useEffect(() => {
    setSelected('');
    questionStartRef.current = Date.now();
  }, [currentQ?.questionId]);

  const answeredCount = questions.filter((q) => q.userAnswer != null).length;
  const diff = difficultyLabels[session.adaptiveState.currentDifficulty] ?? { label: '—', variant: 'secondary' as const };

  const handleNext = async () => {
    if (!currentQ) return;
    if (!selected) { toast.error('Vui lòng chọn đáp án.'); return; }
    setAnswering(true);
    try {
      // Thời gian làm câu = chênh lệch từ lúc câu hiển thị tới lúc trả lời (giây).
      const elapsedSec = Math.max(0, Math.round((Date.now() - questionStartRef.current) / 1000));
      await onAnswer(currentQ.questionId, selected, elapsedSec);
    } finally {
      setAnswering(false);
    }
  };

  const handleFinish = async () => {
    setFinishing(true);
    try {
      await onFinish();
    } finally {
      setFinishing(false);
    }
  };

  const handleAbandon = async () => {
    setAbandoning(true);
    try {
      await onAbandon();
    } finally {
      setAbandoning(false);
    }
  };

  if (!currentQ) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Tất cả câu hỏi đã trả lời. Nhấn &quot;Kết thúc phiên&quot; để xem kết quả.
        </p>
        <Button onClick={handleFinish} disabled={finishing}>
          {finishing ? 'Đang xử lý...' : 'Kết thúc phiên'}
        </Button>
      </div>
    );
  }

  const content = currentQ.questionSnapshot.content;

  return (
    <div className="space-y-4">
      {/* Session meta */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">
          Câu <strong>{currentIdx + 1}</strong> / {questions.length}
          {' · '}Đã trả lời: {answeredCount}
        </span>
        <Badge variant={diff.variant}>{diff.label}</Badge>
        {session.adaptiveState.consecutiveCorrect > 0 && (
          <Badge variant="secondary">
            {session.adaptiveState.consecutiveCorrect} đúng liên tiếp
          </Badge>
        )}
        {session.adaptiveState.consecutiveWrong > 0 && (
          <Badge variant="destructive">
            {session.adaptiveState.consecutiveWrong} sai liên tiếp
          </Badge>
        )}
      </div>

      {/* Progress */}
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary transition-all"
          style={{ width: `${(answeredCount / Math.max(questions.length, 1)) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base leading-relaxed">
            <QuestionContent text={content.questionText} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {content.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => !answering && setSelected(opt.id)}
              disabled={answering}
              className={`flex w-full items-start gap-2 rounded-md border px-4 py-3 text-left text-sm transition-colors ${
                selected === opt.id
                  ? 'border-primary bg-primary/10'
                  : 'border-input hover:bg-accent'
              } ${answering ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span className="font-semibold">{opt.id.toUpperCase()}.</span>
              <QuestionContent text={opt.text} className="min-w-0 flex-1" />
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAbandon}
          disabled={abandoning || answering || finishing}
        >
          {abandoning ? 'Đang hủy...' : 'Hủy phiên'}
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleFinish}
            disabled={finishing || answering || abandoning}
          >
            {finishing ? 'Đang xử lý...' : 'Kết thúc phiên'}
          </Button>
          <Button onClick={handleNext} disabled={answering || finishing || abandoning || !selected}>
            {answering ? 'Đang gửi...' : 'Tiếp theo →'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ----- Main page -----

function PracticeSessionInner({ id }: { id: string }) {
  const router = useRouter();
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    try {
      const s = await practiceApi.get(id);
      setSession(s);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    practiceApi
      .get(id)
      .then((s) => { if (active) { setSession(s); } })
      .catch((err) => { if (active) setError(getErrorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const handleAnswer = useCallback(async (
    questionId: string,
    answer: string,
    timeSpentSeconds: number,
  ) => {
    try {
      const updated = await practiceApi.answer(id, { questionId, answer, timeSpentSeconds });
      setSession(updated);
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
      // Re-fetch to sync state on error
      await loadSession();
    }
  }, [id, loadSession]);

  const handleFinish = useCallback(async () => {
    if (!confirm('Kết thúc phiên và xem kết quả?')) return;
    try {
      const updated = await practiceApi.finish(id);
      setSession(updated);
      toast.success('Phiên luyện tập hoàn thành!');
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
    }
  }, [id]);

  const handleAbandon = useCallback(async () => {
    if (!confirm('Hủy phiên luyện tập? Kết quả sẽ không được lưu.')) return;
    try {
      await practiceApi.abandon(id);
      toast.info('Đã hủy phiên luyện tập.');
      router.push('/dashboard');
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
    }
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-10 w-full" />
        </main>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-2xl p-6">
          <p className="text-sm text-destructive">{error ?? 'Không tải được phiên luyện tập.'}</p>
          <Button className="mt-3" onClick={() => router.push('/dashboard')}>
            Về Dashboard
          </Button>
        </main>
      </div>
    );
  }

  const modeLabel = session.mode === 'adaptive' ? 'Thích nghi' : 'Mô phỏng thi';

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tên chặng lộ trình nếu phiên gắn chặng; nếu không thì tiêu đề chung. */}
          <h1 className="text-xl font-semibold">{session.label || 'Phiên luyện tập'}</h1>
          <Badge variant="outline">{modeLabel}</Badge>
        </div>

        {session.status === 'in_progress' && (
          <ActiveSessionView
            session={session}
            onAnswer={handleAnswer}
            onFinish={handleFinish}
            onAbandon={handleAbandon}
          />
        )}

        {session.status === 'completed' && (
          <>
            <ResultsView session={session} />
            <div className="pt-2 flex gap-2">
              <Button asChild variant="outline">
                <a href="/practice/new">Luyện tập tiếp</a>
              </Button>
              <Button asChild variant="ghost">
                <a href="/dashboard">Về Dashboard</a>
              </Button>
            </div>
          </>
        )}

        {session.status === 'abandoned' && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive font-medium">Phiên luyện tập này đã bị hủy.</p>
            <Button className="mt-3" variant="outline" onClick={() => router.push('/practice/new')}>
              Tạo phiên mới
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function PracticeSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ProtectedRoute>
      <PracticeSessionInner id={id} />
    </ProtectedRoute>
  );
}
