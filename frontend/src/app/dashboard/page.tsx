'use client';

// Dashboard: illustrated hero greeting + always-visible stat cards, a
// continue-learning cue, a subject quick-start grid, then recent assessments /
// learning paths / practice sessions. Visual language matches the auth screens
// (white canvas, soft wavy gray shapes, Plus Jakarta Sans headings, pill cards).

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  GraduationCap,
  PlayCircle,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { AssessmentHistoryModal } from '@/components/assessment-history-modal';
import { StreakBadge } from '@/components/streak-card';
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
import { computeWeekTasks, dayRangeLabel } from '@/lib/learning-path-week';
import type {
  AssessmentSummary,
  LearningPathSummary,
  PracticeSessionSummary,
  Subject,
  WeakTopicItem,
} from '@/lib/types';

const RECENT_LIMIT = 3;
// Tailwind class for the display (heading) font defined in layout.tsx.
const HEADING = 'font-[family-name:var(--font-heading)]';

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

// Hiển thị trình độ NGƯỜI DÙNG CHỌN khi bắt đầu bài (theo difficulty 1/2/3).
const difficultyLabels: Record<number, string> = {
  1: 'Cơ bản',
  2: 'Trung bình',
  3: 'Nâng cao',
};
const formatDifficulty = (d?: number | null) =>
  d != null ? (difficultyLabels[d] ?? null) : null;

// "Chào buổi sáng/chiều/tối" based on user's local clock.
function greetingByHour(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

function Divider() {
  return <div className="h-px bg-zinc-200/80 dark:bg-zinc-700" />;
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

  // Phòng trường hợp backend trả populate object thay vì string (lỗi cũ) —
  // chuẩn hoá về string trước khi tra cứu/slice để không crash UI.
  const subjectName = (raw: unknown) => {
    const id =
      typeof raw === 'string'
        ? raw
        : (raw as { _id?: string } | null)?._id ?? String(raw ?? '');
    return subjects.find((s) => s._id === id)?.name ?? id.slice(-6);
  };

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
        title: s.label || (s.mode === 'exam_simulation' ? 'Mô phỏng đề' : 'Luyện tập thích ứng'),
        subtitle: 'Phiên luyện tập đang dở',
        createdAt: s.createdAt,
      };
    return null;
  }, [assessments, sessions, subjects]);

  // "Việc tuần này" gom across các lộ trình đang active — chặng cần học trong 7 ngày tới.
  const weekAgenda = useMemo(() => {
    const entries: Array<{
      key: string;
      subject: string;
      href: string;
      label: string;
      title: string;
    }> = [];
    let overdueTotal = 0;
    for (const p of paths) {
      if (p.status && p.status !== 'active') continue;
      if (!p.milestones || p.milestones.length === 0) continue;
      const tasks = computeWeekTasks({
        startDate: p.startDate,
        createdAt: p.createdAt,
        milestones: p.milestones,
      });
      overdueTotal += tasks.overdueCount;
      for (const it of tasks.items) {
        entries.push({
          key: `${p._id}-${it.idx}`,
          subject: subjectName(p.subjectId),
          href: `/learning-path/${p._id}/study?m=${it.idx}`,
          label: dayRangeLabel(it.bound),
          title: it.title,
        });
      }
    }
    return { entries, overdueTotal };
  }, [paths, subjects]);

  // Streak = số ngày liên tiếp có hoạt động (đánh giá/luyện tập) tính tới hôm nay.
  // Nếu hôm nay chưa học nhưng hôm qua có → vẫn tính (streak chưa đứt).
  const studyStreak = useMemo(() => {
    const keys = new Set<string>();
    const k = (iso: Date) => `${iso.getFullYear()}-${iso.getMonth()}-${iso.getDate()}`;
    const add = (iso?: string | null) => {
      if (iso) keys.add(k(new Date(iso)));
    };
    for (const a of assessments) {
      add(a.createdAt);
      add(a.completedAt);
    }
    for (const s of sessions) add(s.createdAt);

    const cursor = new Date();
    if (!keys.has(k(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
      if (!keys.has(k(cursor))) return 0;
    }
    let streak = 0;
    while (keys.has(k(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }, [assessments, sessions]);

  const visibleAssessments = assessments.slice(0, RECENT_LIMIT);
  const hasMoreAssessments = assessments.length > RECENT_LIMIT;
  const greeting = greetingByHour();
  const displayName = user?.profile.name?.trim() || 'bạn';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <AppHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:py-10">
        {/* HERO — greeting + illustration on a wavy white panel */}
        <section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 px-6 py-8 shadow-sm sm:px-10 sm:py-10">
          {/* Streak badge nổi ở góc trên-phải */}
          <div className="absolute right-4 top-4 z-20">
            <StreakBadge streak={studyStreak} />
          </div>
          {/* Soft wavy decoration bleeding off the right edge */}
          <svg
            aria-hidden
            className="absolute right-0 top-0 hidden h-full w-2/5 lg:block"
            viewBox="0 0 400 400"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M400 0 H140 C90 110 180 190 120 290 C82 352 150 372 130 400 H400 Z"
              className="fill-zinc-100 dark:fill-zinc-700/40"
            />
          </svg>

          <div className="relative flex items-center justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                {greeting}
              </p>
              <h1 className={`${HEADING} mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl`}>
                Xin chào, {displayName} 👋
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
                Tiếp tục hành trình học tập của bạn. Chọn một môn để đánh giá đầu
                vào, hoặc xem tiến độ bên dưới.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  asChild
                  className="h-11 rounded-xl bg-zinc-900 px-6 font-semibold hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  <a href="#mon-hoc">
                    Bắt đầu đánh giá
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-xl border-zinc-300 px-6 font-semibold"
                >
                  <Link href="/practice/new">Luyện tập ngay</Link>
                </Button>
              </div>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/learning-illustration.svg"
              alt=""
              aria-hidden
              className="pointer-events-none hidden w-56 select-none lg:block xl:w-64"
            />
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* STATS — always-visible metric cards */}
        <StatsGrid
          stats={stats}
          loading={loading}
          assessments={assessments}
          subjects={subjects}
        />

        {/* CONTINUE LEARNING — show only if there is an in-progress item */}
        {inProgress && (
          <Link
            href={inProgress.href}
            className="group block rounded-3xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 p-5 shadow-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700 sm:p-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                <PlayCircle className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wider text-zinc-400">
                  {inProgress.subtitle}
                </p>
                <p className="mt-0.5 truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {inProgress.title}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Bắt đầu {formatDate(inProgress.createdAt)}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        )}

        {/* VIỆC TUẦN NÀY — chặng cần học trong 7 ngày tới, gom từ các lộ trình */}
        {!loading && (weekAgenda.entries.length > 0 || weekAgenda.overdueTotal > 0) && (
          <section>
            <SectionHeader
              title="Việc tuần này"
              description="Các chặng cần học trong 7 ngày tới."
              icon={<Target className="h-4 w-4" />}
            />
            {weekAgenda.entries.length === 0 ? (
              <EmptyState>
                Tuần này không có chặng mới.{' '}
                {weekAgenda.overdueTotal > 0 &&
                  `Bạn còn ${weekAgenda.overdueTotal} chặng trễ lịch — nên học sớm.`}
              </EmptyState>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 shadow-sm">
                {weekAgenda.entries.slice(0, 6).map((e, idx) => (
                  <div key={e.key}>
                    {idx > 0 && <Divider />}
                    <Link
                      href={e.href}
                      className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700"
                    >
                      <Badge variant="outline" className="shrink-0 font-medium">
                        {e.label}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{e.title}</p>
                        <p className="mt-0.5 text-xs text-zinc-400">{e.subject}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
                    </Link>
                  </div>
                ))}
                {weekAgenda.overdueTotal > 0 && (
                  <>
                    <Divider />
                    <p className="px-5 py-3 text-xs text-amber-600">
                      Còn {weekAgenda.overdueTotal} chặng trễ lịch chưa hoàn thành.
                    </p>
                  </>
                )}
              </div>
            )}
          </section>
        )}

        {/* QUICK-START SUBJECTS */}
        <section id="mon-hoc" className="scroll-mt-24">
          <SectionHeader
            title="Bắt đầu một bài đánh giá"
            description="Chọn 1 môn học để kiểm tra đầu vào."
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
            <div className="rounded-3xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
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
            <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 shadow-sm">
              {visibleAssessments.map((a, idx) => (
                <div key={a._id}>
                  {idx > 0 && <Divider />}
                  <div className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                          {subjectName(a.subjectId)}
                        </span>
                        <StatusBadge status={a.status} />
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">
                        {formatDate(a.createdAt)}
                        {a.results && (
                          <>
                            <span className="mx-1.5">·</span>
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                              {a.results.score}/100
                            </span>
                            <span className="ml-1">
                              ({a.results.correctCount}/{a.results.totalQuestions} đúng
                              {formatDifficulty(a.difficulty) &&
                                ` · ${formatDifficulty(a.difficulty)}`}
                              )
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="shrink-0 rounded-lg border-zinc-300">
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
              description="Kế hoạch học chia theo ngày."
              icon={<Target className="h-4 w-4" />}
            />
            {loading ? (
              <Skeleton className="h-28 w-full rounded-3xl" />
            ) : paths.length === 0 ? (
              <EmptyState>
                Chưa có lộ trình. Hoàn thành một bài đánh giá để hệ thống tạo lộ trình.
              </EmptyState>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 shadow-sm">
                {paths.slice(0, 4).map((p, idx) => (
                  <div key={p._id}>
                    {idx > 0 && <Divider />}
                    <Link
                      href={`/learning-path/${p._id}`}
                      className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                          {subjectName(p.subjectId)}
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">
                          Mục tiêu: {p.targetLevel ?? '—'} ·{' '}
                          {p.milestones?.length ?? 0} chặng
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
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
              <Skeleton className="h-28 w-full rounded-3xl" />
            ) : sessions.length === 0 ? (
              <EmptyState>
                Chưa có phiên luyện tập nào.{' '}
                <Link href="/practice/new" className="underline underline-offset-2">
                  Bắt đầu luyện tập →
                </Link>
              </EmptyState>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 shadow-sm">
                {sessions.slice(0, 4).map((s, idx) => (
                  <div key={s._id}>
                    {idx > 0 && <Divider />}
                    <div className="flex items-center justify-between gap-3 px-5 py-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                            {s.label ||
                              (s.mode === 'exam_simulation'
                                ? 'Mô phỏng đề'
                                : 'Luyện tập thích ứng')}
                          </span>
                          <StatusBadge status={s.status} />
                        </div>
                        <p className="mt-1 text-xs text-zinc-400">
                          {formatDate(s.createdAt)}
                          {s.results?.score !== undefined && (
                            <>
                              <span className="mx-1.5">·</span>
                              <span className="font-medium text-zinc-700 dark:text-zinc-300">
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
        <h2 className={`${HEADING} flex items-center gap-2 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100`}>
          {icon && <span className="text-zinc-400">{icon}</span>}
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
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

// Three always-visible metric cards. "Bài hoàn thành" carries a per-subject
// filter; "Điểm yếu" links through to /weakness.
function StatsGrid({
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
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  const completedFiltered = useMemo(() => {
    const completed = assessments.filter((a) => a.status === 'completed');
    if (subjectFilter === 'all') return completed.length;
    return completed.filter((a) => a.subjectId === subjectFilter).length;
  }, [assessments, subjectFilter]);

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <StatCard
        icon={<Trophy className="h-4 w-4" />}
        label="Bài hoàn thành"
        value={completedFiltered}
        loading={loading}
        footer={
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            disabled={loading || subjects.length === 0}
            className="mt-3 w-full rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-700 px-2 py-1.5 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
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
      <StatCard
        icon={<TrendingUp className="h-4 w-4" />}
        label="Điểm trung bình"
        value={stats.completed > 0 ? `${stats.avgScore}/100` : '—'}
        loading={loading}
      />
      <StatCard
        icon={<Target className="h-4 w-4" />}
        label="Điểm yếu cần ôn"
        value={stats.weakTopics}
        loading={loading}
        href={stats.weakTopics > 0 ? '/weakness' : undefined}
        accent={stats.weakTopics > 0}
      />
    </section>
  );
}

// Single metric card. `footer` renders below the value (per-subject filter).
function StatCard({
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
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
          {icon}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-20" />
      ) : (
        <p className={`${HEADING} mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100`}>
          {value}
        </p>
      )}
      {footer}
    </>
  );

  const cls =
    'rounded-3xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 p-5 shadow-sm transition-all';

  if (href) {
    return (
      <Link href={href} className={`${cls} block hover:-translate-y-0.5 hover:shadow-md ${accent ? 'ring-1 ring-zinc-900/5' : ''}`}>
        {body}
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-zinc-500">
          Xem chi tiết <ArrowRight className="h-3 w-3" />
        </span>
      </Link>
    );
  }
  return <div className={cls}>{body}</div>;
}

function SubjectCard({ subject }: { subject: Subject }) {
  return (
    <Link
      href={`/subjects/${subject._id}`}
      className="group flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
          <BookOpen className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-0.5" />
      </div>
      <div>
        <p className={`${HEADING} font-bold tracking-tight text-zinc-900 dark:text-zinc-100`}>
          {subject.name}
        </p>
        <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
          {subject.description ?? `${subject.topics.length} chủ đề`}
        </p>
      </div>
    </Link>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-zinc-300 bg-white/50 py-10 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
      <p className="px-4 text-sm text-zinc-500">{children}</p>
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
