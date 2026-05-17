'use client';

// Weak topics analytics: lists topics where accuracy < 50%.
// Each item has a quick-link to start an adaptive practice session
// pre-filtered to that topic.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { practiceApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';
import type { WeakTopicItem } from '@/lib/types';

function WeaknessInner() {
  const router = useRouter();
  const [items, setItems] = useState<WeakTopicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    practiceApi
      .getWeakTopics()
      .then((data) => {
        if (!active) return;
        // Only show topics with rate < 50%
        setItems(data.filter((i) => i.rate < 0.5));
      })
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const handlePractice = (item: WeakTopicItem) => {
    const params = new URLSearchParams({
      topicIds: item.topicId,
      mode: 'adaptive',
    });
    router.push(`/practice/new?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <section>
          <h1 className="text-2xl font-semibold">Điểm yếu của bạn</h1>
          <p className="text-sm text-muted-foreground">
            Các chủ đề có độ chính xác dưới 50% — cần luyện tập thêm.
          </p>
        </section>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-md border border-border bg-card p-6 text-center space-y-2">
            <p className="text-sm font-medium">Bạn chưa có điểm yếu nào!</p>
            <p className="text-xs text-muted-foreground">
              Tiếp tục luyện tập để hệ thống phân tích và hiển thị dữ liệu ở đây.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => router.push('/practice/new')}
            >
              Bắt đầu luyện tập
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items
              .sort((a, b) => a.rate - b.rate) // worst first
              .map((item) => {
                const pct = Math.round(item.rate * 100);
                return (
                  <Card key={item.topicId}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">
                            {item.topicName ?? item.topicId.slice(-6)}
                          </span>
                          {item.subjectName && (
                            <Badge variant="outline" className="text-xs">
                              {item.subjectName}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {item.correct}/{item.total} câu đúng
                          </span>
                          {/* Accuracy bar */}
                          <div className="flex items-center gap-1">
                            <div className="h-1.5 w-20 rounded-full bg-muted">
                              <div
                                className="h-1.5 rounded-full bg-destructive transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-destructive">
                              {pct}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePractice(item)}
                        className="shrink-0 ml-3"
                      >
                        Luyện tập
                      </Button>
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

export default function WeaknessPage() {
  return (
    <ProtectedRoute>
      <WeaknessInner />
    </ProtectedRoute>
  );
}
