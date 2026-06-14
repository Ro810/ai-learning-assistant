'use client';

// Nút đánh giá chất lượng nội dung Gemini (câu hỏi / lộ trình): 👍 hữu ích / 👎 kém.
// Chọn 👎 sẽ hỏi lý do (tùy chọn) để báo câu sai/khó hiểu. Phản hồi lưu vào DB
// (upsert theo user+nội dung) — dùng để lọc nội dung kém về sau.

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';
import { feedbackApi, type FeedbackTarget, type FeedbackRating } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';

export function FeedbackButtons({
  targetType,
  targetId,
  label = 'Nội dung này thế nào?',
}: {
  targetType: FeedbackTarget;
  targetId: string;
  label?: string;
}) {
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [busy, setBusy] = useState(false);

  const vote = async (next: FeedbackRating) => {
    if (busy) return;
    // 👎 → hỏi lý do (tùy chọn) để báo câu sai/khó hiểu.
    let reason: string | undefined;
    if (next === 'down') {
      const input = window.prompt('Lý do (tùy chọn): câu sai? khó hiểu? đáp án chưa đúng?');
      if (input === null) return; // bấm Cancel → bỏ
      reason = input.trim() || undefined;
    }
    setBusy(true);
    try {
      await feedbackApi.submit({ targetType, targetId, rating: next, reason });
      setRating(next);
      toast.success('Cảm ơn phản hồi của bạn!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const btn = (active: boolean) =>
    `flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
      busy ? 'opacity-50' : ''
    } ${
      active
        ? 'border-primary bg-primary/10 text-primary'
        : 'border-input text-muted-foreground hover:bg-accent'
    }`;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <button
        type="button"
        onClick={() => vote('up')}
        disabled={busy}
        aria-label="Hữu ích"
        title="Hữu ích"
        className={btn(rating === 'up')}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => vote('down')}
        disabled={busy}
        aria-label="Chưa tốt / báo lỗi"
        title="Chưa tốt / báo lỗi"
        className={btn(rating === 'down')}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
