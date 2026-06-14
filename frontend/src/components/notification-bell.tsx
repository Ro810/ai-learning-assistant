'use client';

// Chuông nhắc học trên header. Tự tính từ lộ trình đang active:
//   - Chặng TRỄ LỊCH (qua ngày kết thúc, chưa xong) — ưu tiên trên.
//   - Chặng ĐẾN HẠN trong tuần (Việc tuần này).
// Số đếm = tổng số nhắc; bấm chuông mở dropdown, bấm 1 mục vào thẳng màn học chặng.
// Thuần client (không cần job/email) — dùng helper computeWeekTasks.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, AlertTriangle, CalendarClock } from 'lucide-react';
import { learningPathApi } from '@/lib/api-services';
import { computeWeekTasks, dayRangeLabel } from '@/lib/learning-path-week';

interface Reminder {
  key: string;
  href: string;
  title: string;
  label: string;
  overdue: boolean;
}

export function NotificationBell() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Nạp lộ trình 1 lần → gom các chặng trễ lịch + đến hạn tuần này.
  useEffect(() => {
    let active = true;
    learningPathApi
      .list()
      .then((paths) => {
        if (!active) return;
        const out: Reminder[] = [];
        for (const p of paths) {
          if (p.status && p.status !== 'active') continue;
          if (!p.milestones || p.milestones.length === 0) continue;
          const t = computeWeekTasks({
            startDate: p.startDate,
            createdAt: p.createdAt,
            milestones: p.milestones,
          });
          for (const it of t.overdueItems)
            out.push({
              key: `${p._id}-${it.idx}-o`,
              href: `/learning-path/${p._id}/study?m=${it.idx}`,
              title: it.title,
              label: dayRangeLabel(it.bound),
              overdue: true,
            });
          for (const it of t.items)
            out.push({
              key: `${p._id}-${it.idx}-w`,
              href: `/learning-path/${p._id}/study?m=${it.idx}`,
              title: it.title,
              label: dayRangeLabel(it.bound),
              overdue: false,
            });
        }
        out.sort((a, b) => Number(b.overdue) - Number(a.overdue)); // trễ lịch lên đầu
        setReminders(out);
      })
      .catch(() => {
        /* lỗi tải lộ trình — bỏ qua, chuông trống */
      });
    return () => {
      active = false;
    };
  }, []);

  // Click ra ngoài → đóng dropdown.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const count = reminders.length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Thông báo nhắc học"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          <div className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold dark:border-zinc-700">
            Nhắc học
          </div>
          {count === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Không có nhắc nhở nào. 🎉
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {reminders.map((r) => (
                <li
                  key={r.key}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-700/60"
                >
                  <Link
                    href={r.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-2 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700"
                  >
                    {r.overdue ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    ) : (
                      <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.overdue ? 'Trễ lịch · ' : ''}
                        {r.label}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
