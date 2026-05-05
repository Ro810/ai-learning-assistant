'use client';

// Dashboard: lists user's assessments, learning paths, practice sessions
// + a "start new assessment" entry per subject.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';
import {
  assessmentApi,
  learningPathApi,
  practiceApi,
  subjectApi,
} from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';
import type {
  AssessmentSummary,
  LearningPathSummary,
  PracticeSessionSummary,
  Subject,
} from '@/lib/types';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  in_progress: { label: 'Đang làm', variant: 'default' },
  completed: { label: 'Hoàn thành', variant: 'secondary' },
  abandoned: { label: 'Đã hủy', variant: 'destructive' },
};

function StatusBadge({ status }: { status: string }) {
  const meta = statusLabels[status] ?? { label: status, variant: 'secondary' as const };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN');
}

function DashboardInner() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [paths, setPaths] = useState<LearningPathSummary[]>([]);
  const [sessions, setSessions] = useState<PracticeSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [subjectsData, assessData, pathsData, sessionsData] = await Promise.all([
          subjectApi.list(),
          assessmentApi.list(),
          learningPathApi.list().catch(() => [] as LearningPathSummary[]),
          practiceApi.list().catch(() => [] as PracticeSessionSummary[]),
        ]);
        if (!active) return;
        setSubjects(subjectsData);
        setAssessments(assessData);
        setPaths(pathsData);
        setSessions(sessionsData);
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const subjectName = (id: string) =>
    subjects.find((s) => s._id === id)?.name ?? id.slice(-6);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <section>
          <h1 className="text-2xl font-semibold">Xin chào, {user?.profile.name}</h1>
          <p className="text-sm text-muted-foreground">
            Chọn môn để bắt đầu một bài đánh giá đầu vào hoặc xem tiến độ hiện tại.
          </p>
        </section>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <section>
          <h2 className="mb-3 text-lg font-semibold">Bắt đầu bài đánh giá</h2>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có môn nào. Hãy chạy <code>npm run seed:subjects</code> ở backend.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {subjects.map((s) => (
                <Card key={s._id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{s.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {s.description ?? `${s.topics.length} chủ đề`}
                    </p>
                    <Button asChild size="sm" className="w-full">
                      <Link href={`/assessment/new?subjectId=${s._id}`}>
                        Bắt đầu →
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Bài đánh giá của bạn</h2>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : assessments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có bài đánh giá nào.</p>
          ) : (
            <div className="space-y-2">
              {assessments.map((a) => (
                <Card key={a._id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{subjectName(a.subjectId)}</span>
                        <StatusBadge status={a.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Tạo: {formatDate(a.createdAt)}
                        {a.results && (
                          <>
                            {' · '}
                            <span className="font-medium text-foreground">
                              {a.results.score}/100
                            </span>
                            {' '}({a.results.correctCount}/{a.results.totalQuestions} câu đúng
                            {a.results.recommendedLevel && ` · ${a.results.recommendedLevel}`})
                          </>
                        )}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={
                          a.status === 'completed'
                            ? `/assessment/${a._id}/result`
                            : `/assessment/${a._id}`
                        }
                      >
                        {a.status === 'in_progress'
                          ? 'Tiếp tục'
                          : a.status === 'completed'
                            ? 'Xem kết quả'
                            : 'Xem'}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-lg font-semibold">Lộ trình học</h2>
            {paths.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có lộ trình nào. Hoàn thành một bài đánh giá để hệ thống tạo lộ trình.
              </p>
            ) : (
              <div className="space-y-2">
                {paths.map((p) => (
                  <Card key={p._id}>
                    <CardContent className="py-3">
                      <p className="font-medium">{subjectName(p.subjectId)}</p>
                      <p className="text-xs text-muted-foreground">
                        Mục tiêu: {p.targetLevel ?? '—'} · {p.milestones?.length ?? 0} milestone
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Phiên luyện tập</h2>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có phiên luyện tập nào.</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((s) => (
                  <Card key={s._id}>
                    <CardContent className="flex items-center justify-between py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{s.mode ?? 'practice'}</span>
                          <StatusBadge status={s.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(s.createdAt)}
                          {s.results?.score !== undefined &&
                            ` · ${s.results.score}/100`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardInner />
    </ProtectedRoute>
  );
}
