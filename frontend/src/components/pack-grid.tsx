'use client';

// Study4-style pack cards: title + stats (time/questions) + tags + Chi tiết button.
// 4 cols desktop, 2 cols tablet, 1 col mobile.
// Dùng cho cả Tiếng Anh THPT (60 phút) và Toán THPT (90 phút) — duration lấy từ pack.

import Link from 'next/link';
import { Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TestPack } from '@/lib/types';

interface PackGridProps {
  packs: TestPack[];
  subjectId: string;
  // Tag pills hiển thị (vd: ["Tiếng Anh THPT", "Trắc nghiệm"]).
  tags?: string[];
  // Fallback duration nếu pack chưa lưu durationMinutes.
  fallbackMinutes?: number;
}

export function PackGrid({
  packs,
  subjectId,
  tags = [],
  fallbackMinutes = 60,
}: PackGridProps) {
  if (packs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-10 text-center">
        <p className="text-sm text-muted-foreground">Chưa có đề thi nào.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {packs.map((pack) => (
        <Link
          key={pack._id}
          href={`/subjects/${subjectId}/packs/${pack._id}`}
          className="group rounded-2xl border border-border bg-card p-4 transition-all hover:border-foreground/30 hover:shadow-sm flex flex-col gap-3"
        >
          <h3 className="font-semibold text-base leading-snug">{pack.name}</h3>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {pack.durationMinutes ?? fallbackMinutes} phút
            </span>
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {pack.totalQuestions} câu hỏi
            </span>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-auto w-full pointer-events-none group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary"
          >
            Chi tiết
          </Button>
        </Link>
      ))}
    </div>
  );
}
