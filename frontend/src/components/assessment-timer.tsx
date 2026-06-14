'use client';

// Đồng hồ đếm ngược cho bài đánh giá. Hai chế độ (do backend cấu hình qua `timing`):
//   per_question — đếm lại từ perQuestionSeconds mỗi khi `questionKey` đổi; hết giờ
//                  gọi onTimeout (parent quyết định chuyển câu hay nộp bài).
//   per_exam     — đếm ngược cả đề từ startedAt + totalSeconds (resilient với reload);
//                  hết giờ gọi onTimeout (parent nộp bài).
// onTimeout chỉ kích hoạt 1 lần cho mỗi chu kỳ đếm (firedRef chống gọi lặp).

import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import type { AssessmentTiming } from '@/lib/types';

function formatClock(totalSec: number): string {
  const s = Math.max(0, totalSec);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}:${String(rem).padStart(2, '0')}` : `${rem}s`;
}

export function AssessmentTimer({
  timing,
  active,
  questionKey,
  onTimeout,
}: {
  timing: AssessmentTiming;
  active: boolean;
  // Chỉ dùng cho per_question — đổi giá trị này để reset đồng hồ về đầu.
  questionKey?: string;
  onTimeout: () => void;
}) {
  const [left, setLeft] = useState(0);
  const firedRef = useRef(false);
  // Giữ callback mới nhất để interval không bị stale closure.
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    if (!active) return;
    firedRef.current = false;

    const fire = () => {
      if (!firedRef.current) {
        firedRef.current = true;
        onTimeoutRef.current();
      }
    };

    if (timing.mode === 'per_exam') {
      const total = timing.totalSeconds ?? 0;
      const start = timing.startedAt ? new Date(timing.startedAt).getTime() : Date.now();
      const tick = () => {
        const remaining = Math.max(0, Math.round(total - (Date.now() - start) / 1000));
        setLeft(remaining);
        if (remaining <= 0) fire();
      };
      tick();
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    }

    // per_question — đếm lùi từ perQuestionSeconds.
    const per = timing.perQuestionSeconds ?? 15;
    setLeft(per);
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          fire();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [
    active,
    timing.mode,
    timing.startedAt,
    timing.totalSeconds,
    timing.perQuestionSeconds,
    questionKey,
  ]);

  // Cảnh báo đỏ khi sắp hết: ≤5s (mỗi câu) hoặc ≤30s (cả đề).
  const dangerAt = timing.mode === 'per_exam' ? 30 : 5;
  const danger = left <= dangerAt;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium tabular-nums ${
        danger ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground'
      }`}
      aria-live="polite"
    >
      <Clock className="h-4 w-4" />
      {formatClock(left)}
      {timing.mode === 'per_exam' && <span className="text-xs font-normal"> còn lại</span>}
    </span>
  );
}
