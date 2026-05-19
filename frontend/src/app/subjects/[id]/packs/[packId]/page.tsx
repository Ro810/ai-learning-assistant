'use client';

// Pack detail page: study4-style layout — tags + title + tabs (info / answers)
// + nút "Bắt đầu làm bài" tạo 1 assessment full 40 câu (không chia phần thi).

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, FileText, Play } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { packApi, assessmentApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';
import type { PackDetail } from '@/lib/types';

// Tag pills + duration giờ lấy từ pack/subject — không hardcode môn.
const FALLBACK_MINUTES = 60;
type TabKey = 'info' | 'answers';

function PackDetailInner({ subjectId, packId }: { subjectId: string; packId: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<PackDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('info');

  useEffect(() => {
    let active = true;
    packApi
      .get(packId)
      .then((d) => active && setDetail(d))
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [packId]);

  const handleStart = async () => {
    if (!detail) return;
    setError(null);
    setExistingId(null);
    setStarting(true);
    try {
      const assessment = await assessmentApi.create({
        subjectId,
        packId,
        questionCount: detail.pack.totalQuestions,
      });
      router.push(`/assessment/${assessment._id}`);
    } catch (err: unknown) {
      const e = err as {
        response?: { status?: number; data?: { data?: { existingId?: string } } };
      };
      if (e?.response?.status === 409 && e.response.data?.data?.existingId) {
        setExistingId(e.response.data.data.existingId);
      }
      setError(getErrorMessage(err));
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/subjects/${subjectId}`)}
            className="-ml-2 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại các đề
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-9 w-72" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-11 w-48" />
          </div>
        ) : detail ? (
          <section className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {[detail.subject.name, 'Trắc nghiệm'].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground/80"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <h1 className="text-3xl font-bold tracking-tight">{detail.pack.name}</h1>

            <div className="flex items-center gap-2 border-b border-border">
              <TabButton active={tab === 'info'} onClick={() => setTab('info')}>
                Thông tin đề thi
              </TabButton>
              <TabButton active={tab === 'answers'} onClick={() => setTab('answers')}>
                Đáp án/transcript
              </TabButton>
            </div>

            {tab === 'info' ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    Thời gian làm bài: {detail.pack.durationMinutes ?? FALLBACK_MINUTES} phút
                  </span>
                  <span className="text-border">|</span>
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    {detail.pack.totalQuestions} câu hỏi
                  </span>
                </div>

                <p className="text-sm italic text-destructive">
                  Chú ý: đề gồm {detail.pack.totalQuestions} câu trắc nghiệm.
                  Mỗi câu chọn 1 đáp án — không quay lại sửa sau khi đã nộp.
                </p>

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

                <div className="pt-2">
                  <Button
                    onClick={handleStart}
                    disabled={starting}
                    size="lg"
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    {starting ? 'Đang tạo bài thi...' : 'Bắt đầu làm bài'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Đáp án và lời giải chi tiết sẽ hiện sau khi bạn hoàn thành bài thi này.
                </p>
                <p>
                  Truy cập <span className="font-medium text-foreground">Dashboard → Lịch sử bài thi</span>{' '}
                  để xem lại các bài đã làm cùng đáp án và giải thích từng câu.
                </p>
              </div>
            )}
          </section>
        ) : error ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <div className="rounded-md border border-border p-4 text-sm">
            Không tìm thấy đề thi.
          </div>
        )}
      </main>
    </div>
  );
}

// Tab pill button — active state dùng primary/10 bg + primary text giống reference.
function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors -mb-px border-b-2 ${
        active
          ? 'border-primary text-primary bg-primary/10'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

export default function PackDetailPage({
  params,
}: {
  params: Promise<{ id: string; packId: string }>;
}) {
  const { id, packId } = use(params);
  return (
    <ProtectedRoute>
      <PackDetailInner subjectId={id} packId={packId} />
    </ProtectedRoute>
  );
}
