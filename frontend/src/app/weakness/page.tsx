'use client';

// Weak topics analytics: lists topics where accuracy < 50%.
// Each item has a quick-link to start an adaptive practice session
// pre-filtered to that topic.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import axios from 'axios';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { practiceApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';
import type { WeakTopicItem } from '@/lib/types';

function WeaknessInner() {
  const router = useRouter();
  const [items, setItems] = useState<WeakTopicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // topicId đang tạo phiên — để disable nút + hiện trạng thái.
  const [startingId, setStartingId] = useState<string | null>(null);
  // subjectId đang tạo phiên ôn câu sai (null = không).
  const [reviewingSubject, setReviewingSubject] = useState<string | null>(null);

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

  // Tạo phiên luyện tập trực tiếp cho chủ đề yếu rồi nhảy thẳng vào làm bài,
  // không qua form /practice/new. Gặp 409 (đang có bài dở) → vào luôn bài đó.
  const handlePractice = async (item: WeakTopicItem) => {
    if (startingId) return;
    setStartingId(item.topicId);
    try {
      const session = await practiceApi.create({
        subjectId: item.subjectId,
        topicIds: [item.topicId],
        mode: 'adaptive',
        questionCount: 10,
        label: item.topicName ? `Luyện tập: ${item.topicName}` : undefined,
      });
      router.push(`/practice/${session._id}`);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const existingId = (err.response.data as { data?: { existingId?: string } })?.data?.existingId;
        if (existingId) {
          toast.info('Bạn còn 1 bài đang làm dở — tiếp tục bài đó.');
          router.push(`/practice/${existingId}`);
          return;
        }
      }
      toast.error(getErrorMessage(err));
      setStartingId(null);
    }
  };

  // Tạo phiên ôn lại câu sai CỦA 1 MÔN → vào thẳng bài.
  const handleReviewWrong = async (subjectId: string) => {
    if (reviewingSubject) return;
    setReviewingSubject(subjectId);
    try {
      const session = await practiceApi.reviewWrong(subjectId);
      router.push(`/practice/${session._id}`);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const existingId = (err.response.data as { data?: { existingId?: string } })?.data?.existingId;
        if (existingId) {
          toast.info('Bạn còn 1 bài đang làm dở — tiếp tục bài đó.');
          router.push(`/practice/${existingId}`);
          return;
        }
      }
      toast.error(getErrorMessage(err));
      setReviewingSubject(null);
    }
  };

  // Nhóm chủ đề yếu theo môn để hiện nút "Ôn câu sai" riêng từng môn.
  const groupedBySubject = items
    .slice()
    .sort((a, b) => a.rate - b.rate)
    .reduce<Record<string, { subjectName: string; topics: WeakTopicItem[] }>>(
      (acc, item) => {
        const key = item.subjectId;
        if (!acc[key]) acc[key] = { subjectName: item.subjectName ?? 'Môn học', topics: [] };
        acc[key].topics.push(item);
        return acc;
      },
      {},
    );

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
          <h1 className="text-2xl font-semibold">Điểm yếu của bạn</h1>
          <p className="text-sm text-muted-foreground">
            Các chủ đề có độ chính xác dưới 50% — cần luyện tập thêm. Ôn câu sai theo từng môn.
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
          <div className="space-y-6">
            {Object.entries(groupedBySubject).map(([subjectId, group]) => (
              <section key={subjectId} className="space-y-3">
                {/* Header môn + nút ôn câu sai riêng môn này */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">{group.subjectName}</h2>
                  <Button
                    size="sm"
                    onClick={() => handleReviewWrong(subjectId)}
                    disabled={reviewingSubject !== null}
                    className="shrink-0"
                  >
                    {reviewingSubject === subjectId ? 'Đang tạo...' : 'Ôn câu sai môn này'}
                  </Button>
                </div>

                {group.topics.map((item) => {
                  const pct = Math.round(item.rate * 100);
                  return (
                    <Card key={item.topicId}>
                      <CardContent className="flex items-center justify-between py-4">
                        <div className="space-y-1 min-w-0">
                          <span className="font-medium truncate block">
                            {item.topicName ?? item.topicId.slice(-6)}
                          </span>
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
                          disabled={startingId !== null}
                          className="shrink-0 ml-3"
                        >
                          {startingId === item.topicId ? 'Đang tạo...' : 'Luyện tập'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </section>
            ))}
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
