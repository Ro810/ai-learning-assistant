'use client';

// Dashboard: hero greeting + stats overview, continue-learning cue, subject
// quick-start grid, then recent assessments / learning paths / practice
// sessions. Mirrors the rounded-2xl/iOS-settings design language used in the
// Profile page.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Flame,
  GraduationCap,
  PlayCircle,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { AssessmentHistoryModal } from '@/components/assessment-history-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  WeakTopicItem,
} from '@/lib/types';

const RECENT_LIMIT = 3;

const statusLabels: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' }
> = {
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
  return new Date(iso).toLocaleDateString('vi-VN');
}

// "Chào buổi sáng/chiều/tối" based on user's local clock.
function greetingByHour(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

function Divider() {
  return <div className="h-px bg-border" />;
}

function DashboardInner() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [paths, setPaths] = useState<LearningPathSummary[]>([]);
  const [sessions, setSessions] = useState<PracticeSessionSummary[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [subjectsData, assessData, pathsData, sessionsData, weakData] =
          await Promise.all([
            subjectApi.list(),
            assessmentApi.list(),
            learningPathApi.list().catch(() => [] as LearningPathSummary[]),
            practiceApi.list().catch(() => [] as PracticeSessionSummary[]),
            practiceApi.getWeakTopics().catch(() => [] as WeakTopicItem[]),
          ]);
        if (!active) return;
        setSubjects(subjectsData ?? []);
        setAssessments(assessData ?? []);
        setPaths(pathsData ?? []);
        setSessions(sessionsData ?? []);
        setWeakTopics(weakData ?? []);
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

  // Derived stats. Defensive against undefined arrays in case the backend
  // returns a payload missing the expected list field.
  const stats = useMemo(() => {
    const allAssessments = assessments ?? [];
    const completed = allAssessments.filter((a) => a.status === 'completed');
    const avgScore = completed.length
      ? Math.round(
          completed.reduce((sum, a) => sum + (a.results?.score ?? 0), 0) /
            completed.length,
        )
      : 0;
    return {
      completed: completed.length,
      avgScore,
      // Count only topics with rate < 50% — matches /weakness page filter.
      weakTopics: (weakTopics ?? []).filter((t) => t.rate < 0.5).length,
    };
  }, [assessments, weakTopics]);

  // First in-progress activity to surface as "Tiếp tục".
  const inProgress = useMemo(() => {
    const a = assessments.find((x) => x.status === 'in_progress');
    if (a)
      return {
        kind: 'assessment' as const,
        href: `/assessment/${a._id}`,
        title: subjectName(a.subjectId),
        subtitle: 'Bài đánh giá đang dở',
        createdAt: a.createdAt,
      };
    const s = sessions.find((x) => x.status === 'in_progress');
    if (s)
      return {
        kind: 'practice' as const,
        href: `/practice/${s._id}`,
        title: s.mode === 'exam_simulation' ? 'Mô phỏng đề' : 'Luyện tập thích ứng',
        subtitle: 'Phiên luyện tập đang dở',
        createdAt: s.createdAt,
      };
    return null;
  }, [assessments, sessions, subjects]);

  const visibleAssessments = assessments.slice(0, RECENT_LIMIT);
  const hasMoreAssessments = assessments.length > RECENT_LIMIT;
  const greeting = greetingByHour();
  const displayName = user?.profile.name?.trim() || 'bạn';

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10 space-y-10">
        {/* HERO — greeting */}
        <section>
          <p className="text-sm text-muted-foreground">{greeting},</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">
            {displayName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Tiếp tục hành trình học tập của bạn. Chọn một môn để đánh giá đầu vào hoặc xem tiến độ
            bên dưới.
          </p>
        </section>

        {error && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* STATS — collapsible summary card; expands to 3 metric tiles
            (Bài hoàn thành có filter lọc theo môn). */}
        <section>
          <StatsPanel
            stats={stats}
            loading={loading}
            assessments={assessments}
            subjects={subjects}
          />
        </section>

        {/* CONTINUE LEARNING — show only if there is an in-progress item */}
        {inProgress && (
          <section>
            <Link
              href={inProgress.href}
              className="group block rounded-2xl border border-border bg-card p-5 sm:p-6 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <PlayCircle className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {inProgress.subtitle}
                  </p>
                  <p className="font-medium text-base truncate mt-0.5">
                    {inProgress.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Bắt đầu {formatDate(inProgress.createdAt)}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          </section>
        )}

        {/* QUICK-START SUBJECTS */}
        <section>
          <SectionHeader
            title="Bắt đầu một bài đánh giá"
            description="Chọn môn học để AI sinh đề kiểm tra đầu vào."
          />
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <EmptyState>
              Chưa có môn nào. Hãy chạy <code className="font-mono text-xs">npm run seed:subjects</code> ở backend.
            </EmptyState>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {subjects.map((s) => (
                <SubjectCard key={s._id} subject={s} />
              ))}
            </div>
          )}
        </section>

        {/* RECENT ASSESSMENTS */}
        <section>
          <SectionHeader
            title="Lịch sử làm bài"
            action={
              hasMoreAssessments && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHistoryOpen(true)}
                >
                  Xem tất cả ({assessments.length})
                </Button>
              )
            }
          />
          {loading ? (
            <div className="rounded-2xl border border-border bg-card">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-4">
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : visibleAssessments.length === 0 ? (
            <EmptyState>
              Chưa có bài đánh giá nào. Chọn một môn ở trên để bắt đầu.
            </EmptyState>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {visibleAssessments.map((a, idx) => (
                <div key={a._id}>
                  {idx > 0 && <Divider />}
                  <div className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">
                          {subjectName(a.subjectId)}
                        </span>
                        <StatusBadge status={a.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(a.createdAt)}
                        {a.results && (
                          <>
                            <span className="mx-1.5">·</span>
                            <span className="font-medium text-foreground">
                              {a.results.score}/100
                            </span>
                            <span className="ml-1">
                              ({a.results.correctCount}/{a.results.totalQuestions} đúng
                              {a.results.recommendedLevel &&
                                ` · ${a.results.recommendedLevel}`}
                              )
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="shrink-0">
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* LEARNING PATHS + PRACTICE SESSIONS */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div>
            <SectionHeader
              title="Lộ trình học"
              description="Kế hoạch theo tuần do AI đề xuất."
              icon={<Target className="h-4 w-4" />}
            />
            {loading ? (
              <Skeleton className="h-28 w-full rounded-2xl" />
            ) : paths.length === 0 ? (
              <EmptyState>
                Chưa có lộ trình. Hoàn thành một bài đánh giá để hệ thống tạo lộ trình.
              </EmptyState>
            ) : (
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                {paths.slice(0, 4).map((p, idx) => (
                  <div key={p._id}>
                    {idx > 0 && <Divider />}
                    <Link
                      href={`/learning-path/${p._id}`}
                      className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-accent transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {subjectName(p.subjectId)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Mục tiêu: {p.targetLevel ?? '—'} ·{' '}
                          {p.milestones?.length ?? 0} milestone
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <SectionHeader
              title="Phiên luyện tập"
              description="Adaptive practice + mô phỏng đề."
              icon={<GraduationCap className="h-4 w-4" />}
            />
            {loading ? (
              <Skeleton className="h-28 w-full rounded-2xl" />
            ) : sessions.length === 0 ? (
              <EmptyState>
                Chưa có phiên luyện tập nào.{' '}
                <Link href="/practice/new" className="underline underline-offset-2">
                  Bắt đầu luyện tập →
                </Link>
              </EmptyState>
            ) : (
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                {sessions.slice(0, 4).map((s, idx) => (
                  <div key={s._id}>
                    {idx > 0 && <Divider />}
                    <div className="flex items-center justify-between gap-3 px-5 py-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">
                            {s.mode === 'exam_simulation'
                              ? 'Mô phỏng đề'
                              : 'Luyện tập thích ứng'}
                          </span>
                          <StatusBadge status={s.status} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(s.createdAt)}
                          {s.results?.score !== undefined && (
                            <>
                              <span className="mx-1.5">·</span>
                              <span className="font-medium text-foreground">
                                {s.results.score}/100
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <AssessmentHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        assessments={assessments}
        subjects={subjects}
      />
    </div>
  );
}

// ---------- Sub-components ----------

function SectionHeader({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface DashboardStats {
  completed: number;
  avgScore: number;
  weakTopics: number;
}

// Collapsible aggregate of the key metrics. Header acts as a toggle —
// expands to a 3-tile grid (Bài hoàn thành / Điểm TB / Điểm yếu).
// "Bài hoàn thành" tile has a per-subject filter; "Điểm yếu" clicks through
// to /weakness.
function StatsPanel({
  stats,
  loading,
  assessments,
  subjects,
}: {
  stats: DashboardStats;
  loading: boolean;
  assessments: AssessmentSummary[];
  subjects: Subject[];
}) {
  const [open, setOpen] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Completed count filtered by selected subject.
  const completedFiltered = useMemo(() => {
    const completed = assessments.filter((a) => a.status === 'completed');
    if (subjectFilter === 'all') return completed.length;
    return completed.filter((a) => a.subjectId === subjectFilter).length;
  }, [assessments, subjectFilter]);

  // One-line summary shown while collapsed (always all-subjects totals so
  // the headline is stable regardless of the filter chosen inside).
  const summary = loading
    ? 'Đang tải...'
    : stats.completed === 0
      ? 'Chưa có dữ liệu — hoàn thành 1 bài đánh giá để xem thống kê.'
      : `${stats.completed} bài · TB ${stats.avgScore}/100 · ${stats.weakTopics} điểm yếu`;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-accent transition-colors"
      >
        <div className="h-9 w-9 shrink-0 rounded-xl bg-muted flex items-center justify-center">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold tracking-tight">Thống kê của tôi</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {summary}
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <>
          <Divider />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border">
            <StatTile
              icon={<Trophy className="h-4 w-4" />}
              label="Bài hoàn thành"
              value={completedFiltered}
              loading={loading}
              footer={
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  disabled={loading || subjects.length === 0}
                  className="mt-3 w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  aria-label="Lọc theo môn"
                >
                  <option value="all">Tất cả môn</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              }
            />
            <StatTile
              icon={<TrendingUp className="h-4 w-4" />}
              label="Điểm trung bình"
              value={stats.completed > 0 ? `${stats.avgScore}/100` : '—'}
              loading={loading}
            />
            <StatTile
              icon={<Flame className="h-4 w-4" />}
              label="Điểm yếu cần ôn"
              value={stats.weakTopics}
              loading={loading}
              href={stats.weakTopics > 0 ? '/weakness' : undefined}
              accent={stats.weakTopics > 0}
            />
          </div>
        </>
      )}
    </div>
  );
}

// Single metric tile rendered inside StatsPanel's expanded grid.
// `footer` slot renders below the value (used for the per-subject filter).
function StatTile({
  icon,
  label,
  value,
  loading,
  href,
  accent,
  footer,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  loading?: boolean;
  href?: string;
  accent?: boolean;
  footer?: React.ReactNode;
}) {
  const body = (
    <>
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className={accent ? 'text-orange-500' : ''}>{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-16 mt-3" />
      ) : (
        <p
          className={`text-2xl sm:text-3xl font-semibold tracking-tight mt-2 ${
            accent && typeof value === 'number' && value > 0
              ? 'text-orange-500'
              : ''
          }`}
        >
          {value}
        </p>
      )}
      {footer}
    </>
  );

  const cls = 'bg-card p-4 sm:p-5 transition-colors';

  if (href) {
    return (
      <Link href={href} className={`${cls} hover:bg-accent block`}>
        {body}
      </Link>
    );
  }
  return <div className={cls}>{body}</div>;
}

function SubjectCard({ subject }: { subject: Subject }) {
  return (
    <Link
      href={`/subjects/${subject._id}`}
      className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-foreground/30 hover:shadow-sm flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <div>
        <p className="font-semibold tracking-tight">{subject.name}</p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {subject.description ?? `${subject.topics.length} chủ đề`}
        </p>
      </div>
    </Link>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border py-10 text-center">
      <p className="text-sm text-muted-foreground px-4">{children}</p>
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
