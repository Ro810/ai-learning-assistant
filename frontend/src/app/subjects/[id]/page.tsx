'use client';

// Subject detail page: conditional render based on subject.code.
// - english-thpt: shows PackGrid (10 exam packs).
// - other subjects: shows topic grid (IELTS / AI-flow).

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PackGrid } from '@/components/pack-grid';
import { TopicStudyView } from '@/components/topic-study-view';
import { subjectApi, packApi } from '@/lib/api-services';
import { topicIcon } from '@/lib/topic-icon';
import { getErrorMessage } from '@/lib/api-client';
import type { Subject, TestPack, Topic } from '@/lib/types';

// ---- Topic grid (non-english-thpt subjects) ----

interface TopicGridProps {
  topics: Topic[];
  subjectId: string;
  onTopicClick: (topic: Topic) => void;
}

function TopicGrid({ topics, subjectId, onTopicClick }: TopicGridProps) {
  if (topics.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-10 text-center">
        <p className="text-sm text-muted-foreground">Môn này chưa có kỹ năng/chủ đề nào.</p>
      </div>
    );
  }
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {topics.map((topic) => {
          const Icon = topicIcon(topic.name);
          return (
            <button
              key={topic._id}
              onClick={() => onTopicClick(topic)}
              className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-foreground/30 hover:shadow-sm flex flex-col gap-3 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <div>
                <p className="font-semibold tracking-tight">{topic.name}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {topic.description?.trim() || 'Bắt đầu bài test'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      <div className="pt-4">
        <Link
          href={`/assessment/new?subjectId=${subjectId}`}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Hoặc làm bài đánh giá toàn môn (mix tất cả kỹ năng) →
        </Link>
      </div>
    </>
  );
}

// ---- Main page ----

function SubjectDetailInner({ id }: { id: string }) {
  const router = useRouter();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [packs, setPacks] = useState<TestPack[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    subjectApi
      .get(id)
      .then(async (data) => {
        if (!active) return;
        setSubject(data);
        if (data.code === 'english-thpt' || data.code === 'math-thpt') {
          try {
            const packsData = await packApi.listBySubject(id);
            if (active) setPacks(packsData);
          } catch (packErr) {
            if (active) setError(getErrorMessage(packErr));
          }
        }
      })
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  const handleTopicClick = (topic: Topic) => {
    const params = new URLSearchParams({
      subjectId: id,
      topicId: topic._id,
      topicName: topic.name,
    });
    router.push(`/assessment/new?${params.toString()}`);
  };

  const isPackMode = subject?.code === 'english-thpt' || subject?.code === 'math-thpt';
  const isStudyMode =
    subject?.code === 'python-programming' || subject?.code === 'english-communication';
  // Duration mặc định + tags theo môn — nếu pack đã có durationMinutes thì ưu tiên cái đó.
  const packFallbackMinutes = subject?.code === 'math-thpt' ? 90 : 60;
  // Chỉ math-thpt hỗ trợ sinh đề mới động (đồng bộ với GENERATABLE_SUBJECTS ở backend).
  const canGenerateMore = subject?.code === 'math-thpt';

  const handleGeneratePack = async () => {
    setGenerateError(null);
    setGenerating(true);
    try {
      const result = await packApi.generateForSubject(id);
      setPacks((prev) => [...(prev ?? []), result.pack]);
    } catch (err) {
      setGenerateError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="-ml-2 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại
          </Button>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        ) : subject ? (
          <>
            <section className="space-y-1">
              <h1 className="text-2xl font-semibold">{subject.name}</h1>
              {subject.description && (
                <p className="text-sm text-muted-foreground">{subject.description}</p>
              )}
              <p className="text-xs text-muted-foreground pt-1">
                {isPackMode
                  ? 'Chọn một đề để bắt đầu luyện thi.'
                  : isStudyMode
                  ? 'Chọn chủ đề bên trái — xem tóm tắt rồi bắt đầu làm bài.'
                  : 'Chọn một kỹ năng để bắt đầu bài test.'}
              </p>
            </section>

            {isPackMode ? (
              <>
                <PackGrid
                  packs={packs ?? []}
                  subjectId={id}
                  tags={[subject.name, 'Trắc nghiệm']}
                  fallbackMinutes={packFallbackMinutes}
                />
                {canGenerateMore && (
                  <div className="flex flex-col items-center gap-2 pt-4">
                    {generateError && (
                      <p className="text-sm text-destructive">{generateError}</p>
                    )}
                    <Button
                      onClick={handleGeneratePack}
                      disabled={generating}
                      variant="outline"
                      size="lg"
                      className="gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      {generating ? 'AI đang sinh đề mới (30-60s)...' : 'Sinh đề mới (AI)'}
                    </Button>
                    {generating && (
                      <p className="text-xs text-muted-foreground">
                        Đang gọi Gemini sinh 50 câu — vui lòng giữ tab mở.
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : isStudyMode ? (
              <TopicStudyView subject={subject} subjectId={id} />
            ) : (
              <TopicGrid
                topics={subject.topics}
                subjectId={id}
                onTopicClick={handleTopicClick}
              />
            )}
          </>
        ) : (
          <div className="rounded-md border border-border p-4 text-sm">
            Không tìm thấy môn học.
          </div>
        )}
      </main>
    </div>
  );
}

export default function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ProtectedRoute>
      <SubjectDetailInner id={id} />
    </ProtectedRoute>
  );
}
