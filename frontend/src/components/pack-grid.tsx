'use client';

// Study4-style pack cards: title + stats (time/questions) + tags + Chi tiết button.
// 4 cols ở desktop, 2 cols tablet, 1 col mobile. Đề Tiếng Anh THPT mặc định 60 phút.

import Link from 'next/link';
import { Clock, FileText, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TestPack } from '@/lib/types';

interface PackGridProps {
  packs: TestPack[];
  subjectId: string;
}

// Tag pills hiển thị cho mỗi đề. Static cho MVP — sau này có thể đẩy lên DB.
const TAGS = ['Tiếng Anh THPT', 'Trắc nghiệm'];

// Time estimate khớp với đề thi tốt nghiệp THPT môn Anh thật (60 phút).
const ESTIMATED_MINUTES = 60;

export function PackGrid({ packs, subjectId }: PackGridProps) {
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
              {ESTIMATED_MINUTES} phút
            </span>
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {pack.totalQuestions} câu hỏi
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            <span>6 phần thi</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {TAGS.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary"
              >
                #{tag}
              </span>
            ))}
          </div>

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
