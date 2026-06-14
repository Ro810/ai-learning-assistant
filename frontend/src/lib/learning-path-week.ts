// Tính "việc tuần này" cho lộ trình học chia theo ngày.
// Mỗi chặng chiếm 1 khoảng ngày tích lũy (theo estimatedDays). Cửa sổ tuần = 7 ngày
// kể từ HÔM NAY (tính theo startDate). Dùng chung cho trang chi tiết lộ trình + Dashboard.

interface WeekMilestone {
  estimatedDays?: number;
  completedAt?: string | null;
  completionRate?: number;
  title?: string;
}

interface WeekPath {
  startDate?: string | null;
  createdAt: string;
  milestones: WeekMilestone[];
}

export interface DayBound {
  start: number;
  end: number;
}

export interface WeekTask {
  idx: number;
  bound: DayBound;
  title: string;
}

export interface WeekTasks {
  todayNum: number;
  weekEnd: number;
  items: WeekTask[];
  // Các chặng chưa xong đã qua ngày kết thúc (trễ lịch).
  overdueItems: WeekTask[];
  overdueCount: number;
  allDone: boolean;
}

// Khoảng ngày tích lũy (số) cho mỗi chặng: chặng 1 = ngày 1..d1, chặng 2 = (d1+1)..(d1+d2)...
export function buildDayBounds(milestones: Array<{ estimatedDays?: number }>): DayBound[] {
  let cursor = 0;
  return milestones.map((m) => {
    const span = Math.max(1, m.estimatedDays || 1);
    const start = cursor + 1;
    const end = cursor + span;
    cursor = end;
    return { start, end };
  });
}

// Nhãn khoảng ngày: 1 ngày → "Ngày 3"; nhiều ngày → "Ngày 4–6".
export function dayRangeLabel(b: DayBound): string {
  return b.start === b.end ? `Ngày ${b.start}` : `Ngày ${b.start}–${b.end}`;
}

// Chặng coi là xong khi có completedAt hoặc completionRate=100.
function isMilestoneDone(m: WeekMilestone): boolean {
  return Boolean(m.completedAt) || m.completionRate === 100;
}

// Gom các chặng cần học trong tuần (chưa xong, khoảng ngày giao [todayNum, todayNum+6]).
// Chặng chưa xong đã qua ngày kết thúc → tính trễ lịch (overdueCount).
export function computeWeekTasks(path: WeekPath): WeekTasks {
  const bounds = buildDayBounds(path.milestones);
  const startBase = new Date(path.startDate ?? path.createdAt).getTime();
  const todayNum = Math.max(1, Math.floor((Date.now() - startBase) / 86_400_000) + 1);
  const weekEnd = todayNum + 6;

  const items: WeekTask[] = [];
  const overdueItems: WeekTask[] = [];
  let doneCount = 0;

  path.milestones.forEach((m, idx) => {
    if (isMilestoneDone(m)) {
      doneCount += 1;
      return;
    }
    const bound = bounds[idx];
    const task = { idx, bound, title: m.title || `Chặng ${idx + 1}` };
    if (bound.end < todayNum) overdueItems.push(task);
    else if (bound.start <= weekEnd) items.push(task);
  });

  return {
    todayNum,
    weekEnd,
    items,
    overdueItems,
    overdueCount: overdueItems.length,
    allDone: doneCount === path.milestones.length && path.milestones.length > 0,
  };
}
