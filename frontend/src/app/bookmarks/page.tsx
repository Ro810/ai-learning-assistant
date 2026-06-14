'use client';

// Trang "Câu hỏi đã lưu" — liệt kê các câu bookmark để xem lại (kèm đáp án + giải thích).
// Bỏ lưu sẽ ẩn câu khỏi danh sách ngay.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { QuestionContent } from '@/components/question-content';
import { BookmarkButton } from '@/components/bookmark-button';
import { AskAiButton } from '@/components/ask-ai-button';
import { bookmarkApi, type BookmarkItem } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';

const diffLabels: Record<number, string> = { 1: 'Dễ', 2: 'Trung bình', 3: 'Khó' };

function BookmarksInner() {
  const router = useRouter();
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    bookmarkApi
      .list()
      .then((data) => active && setItems(data))
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="-ml-2 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại Dashboard
          </Button>
        </div>

        <section>
          <h1 className="text-2xl font-semibold">Câu hỏi đã lưu</h1>
          <p className="text-sm text-muted-foreground">
            Các câu bạn đánh dấu để xem lại.
          </p>
        </section>

        {error && (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-10 text-center">
            <p className="text-sm font-medium">Chưa có câu hỏi nào được lưu.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ở phần xem lại bài, bấm “Lưu” trên câu hỏi hay để thêm vào đây.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((it, idx) => (
              <Card key={it._id}>
                <CardContent className="space-y-3 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 text-sm font-medium">
                      <span className="mr-1">Câu {idx + 1}.</span>
                      <QuestionContent text={it.content.questionText} className="inline" />
                    </div>
                    {it.difficulty && (
                      <Badge variant="secondary">{diffLabels[it.difficulty] ?? `Độ khó ${it.difficulty}`}</Badge>
                    )}
                  </div>

                  <ul className="space-y-1 text-sm">
                    {it.content.options.map((opt) => {
                      const isCorrect = opt.id === it.content.correctAnswer;
                      return (
                        <li
                          key={opt.id}
                          className={`rounded px-2 py-1 ${
                            isCorrect
                              ? 'bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100'
                              : ''
                          }`}
                        >
                          <span className="mr-1 font-semibold">{opt.id.toUpperCase()}.</span>
                          <QuestionContent text={opt.text} className="inline" />
                          {isCorrect && ' ✓'}
                        </li>
                      );
                    })}
                  </ul>

                  {it.content.explanation && (
                    <p className="text-xs text-muted-foreground">
                      <strong>Giải thích:</strong> {it.content.explanation}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <BookmarkButton
                      questionId={it.questionId}
                      initial
                      onChange={(b) => {
                        if (!b) setItems((prev) => prev.filter((x) => x._id !== it._id));
                      }}
                    />
                    <AskAiButton question={it.content} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function BookmarksPage() {
  return (
    <ProtectedRoute>
      <BookmarksInner />
    </ProtectedRoute>
  );
}
