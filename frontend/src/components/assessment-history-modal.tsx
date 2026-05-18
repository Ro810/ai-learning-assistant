'use client';

// Modal hiển thị toàn bộ lịch sử bài đánh giá của user, có filter theo môn.
// Dùng lightweight modal tự build (không kéo dependency Radix Dialog) để giữ
// bundle nhẹ — chỉ render khi `open` = true, click overlay hoặc nhấn Esc để
// đóng, lock scroll body khi mở.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AssessmentSummary, Subject } from '@/lib/types';

const statusLabels: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' }
> = {
  in_progress: { label: 'Đang làm', variant: 'default' },
  completed: { label: 'Hoàn thành', variant: 'secondary' },
  abandoned: { label: 'Đã hủy', variant: 'destructive' },
};

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN') : '—';

export function AssessmentHistoryModal({
  open,
  onClose,
  assessments,
  subjects,
}: {
  open: boolean;
  onClose: () => void;
  assessments: AssessmentSummary[];
  subjects: Subject[];
}) {
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Đóng modal khi nhấn Esc + lock body scroll khi mở.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const base =
      subjectFilter === 'all'
        ? assessments
        : assessments.filter((a) => a.subjectId === subjectFilter);
    // Sắp xếp mới nhất lên đầu để 3-4 bài hiển thị đầu tiên là gần nhất.
    return [...base].sort((a, b) => {
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      return tb - ta;
    });
  }, [assessments, subjectFilter]);

  const subjectName = (id: string) =>
    subjects.find((s) => s._id === id)?.name ?? id.slice(-6);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assessment-history-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="min-w-0">
            <h2
              id="assessment-history-title"
              className="text-base font-semibold tracking-tight"
            >
              Lịch sử làm bài
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filtered.length} / {assessments.length} bài
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Filter */}
        <div className="px-5 py-3 border-b border-border bg-muted/30">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Lọc theo môn
          </label>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">Tất cả môn</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* List — giới hạn chiều cao ~4 bài, phần còn lại kéo thanh cuộn để xem */}
        <div className="overflow-y-auto max-h-[340px]">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Không có bài nào khớp với bộ lọc.
            </div>
          ) : (
            <div>
              {filtered.map((a, idx) => (
                <div key={a._id}>
                  {idx > 0 && <div className="h-px bg-border" />}
                  <div className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">
                          {subjectName(a.subjectId)}
                        </span>
                        <Badge
                          variant={
                            statusLabels[a.status]?.variant ?? 'secondary'
                          }
                        >
                          {statusLabels[a.status]?.label ?? a.status}
                        </Badge>
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
                              ({a.results.correctCount}/
                              {a.results.totalQuestions} đúng
                              {a.results.recommendedLevel &&
                                ` · ${a.results.recommendedLevel}`}
                              )
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={onClose}
                    >
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
        </div>
      </div>
    </div>
  );
}
