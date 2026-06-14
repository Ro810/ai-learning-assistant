'use client';

// Nút sao đánh dấu (bookmark) 1 câu hỏi để xem lại. `initial` = đã bookmark sẵn chưa
// (do trang cha nạp 1 lần qua bookmarkApi.ids()). Toggle lạc quan, đồng bộ server.

import { useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { bookmarkApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api-client';

export function BookmarkButton({
  questionId,
  initial = false,
  onChange,
}: {
  questionId: string;
  initial?: boolean;
  onChange?: (bookmarked: boolean) => void;
}) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);

  // Đồng bộ khi danh sách id được nạp sau lúc mount.
  useEffect(() => setOn(initial), [initial]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const bookmarked = await bookmarkApi.toggle(questionId);
      setOn(bookmarked);
      onChange?.(bookmarked);
      toast.success(bookmarked ? 'Đã lưu câu hỏi.' : 'Đã bỏ lưu.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={on ? 'Bỏ lưu câu hỏi' : 'Lưu câu hỏi'}
      title={on ? 'Bỏ lưu' : 'Lưu để xem lại'}
      className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${
        on ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500'
      } ${busy ? 'opacity-50' : ''}`}
    >
      <Bookmark className={`h-3.5 w-3.5 ${on ? 'fill-amber-500' : ''}`} />
      {on ? 'Đã lưu' : 'Lưu'}
    </button>
  );
}
