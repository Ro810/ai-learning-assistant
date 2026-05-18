'use client';

// Subject detail page: shows the subject + a grid of its topics as cards.
// Clicking a topic card starts an assessment scoped to that single topic
// (e.g. IELTS Reading-only test).

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Headphones,
  Mic,
  PenLine,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { subjectApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';
import type { Subject, Topic } from '@/lib/types';

// Pick an icon based on the topic name. Falls back to BookOpen.
// Covers IELTS skills (Reading/Listening/Writing/Speaking) and generic
// "đọc/nghe/viết/nói" Vietnamese variants.
function topicIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('listening') || n.includes('nghe')) return Headphones;
  if (n.includes('speaking') || n.includes('nói')) return Mic;
  if (n.includes('writing') || n.includes('viết')) return PenLine;
  return BookOpen;
}

function SubjectDetailInner({ id }: { id: string }) {
  const router = useRouter();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    subjectApi
      .get(id)
      .then((data) => active && setSubject(data))
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const handleTopicClick = (topic: Topic) => {
    const params = new URLSearchParams({
      subjectId: id,
      topicId: topic._id,
      // Carry the name in the URL so /assessment/new can render it without
      // refetching the subject (subjectApi.list omits the topics array).
      topicName: topic.name,
    });
    router.push(`/assessment/new?${params.toString()}`);
  };

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
                Chọn một kỹ năng để bắt đầu bài test.
              </p>
            </section>

            {subject.topics.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  Môn này chưa có kỹ năng/chủ đề nào.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subject.topics.map((topic) => {
                  const Icon = topicIcon(topic.name);
                  return (
                    <button
                      key={topic._id}
                      onClick={() => handleTopicClick(topic)}
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
                        <p className="text-xs text-muted-foreground mt-1">
                          Bắt đầu bài test
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="pt-4">
              <Link
                href={`/assessment/new?subjectId=${id}`}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                Hoặc làm bài đánh giá toàn môn (mix tất cả kỹ năng) →
              </Link>
            </div>
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
