'use client';

// Badge "Chuỗi ngày học" nổi ở góc hero (kiểu streak TikTok/Duolingo).
//   - streak > 0: mascot lửa ĐỎ ngộ nghĩnh (mắt to long lanh, má hồng, lưỡi, vẫy tay,
//     lấp lánh) trên nền gradient cam→đỏ, nhấp nháy + nảy.
//   - streak = 0: lửa xám "ngủ" trên nền xám.
// Hiệu ứng = CSS keyframes (.animate-flame/.animate-mascot/.animate-sparkle), tự tắt
// khi prefers-reduced-motion.

// Mascot ngọn lửa có khuôn mặt dễ thương. active=true → đỏ + động; false → xám + ngủ.
function FlameBuddy({ active }: { active: boolean }) {
  return (
    <div className={active ? 'animate-mascot' : ''}>
      <svg
        viewBox="0 0 72 80"
        className={`h-12 w-12 ${active ? 'animate-flame drop-shadow-[0_3px_8px_rgba(220,38,38,0.5)]' : ''}`}
        role="img"
        aria-label={active ? 'Ngọn lửa chuỗi học đang cháy' : 'Ngọn lửa đang ngủ'}
      >
        <defs>
          <linearGradient id="flameBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="45%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>

        {/* Lấp lánh quanh lửa khi active */}
        {active && (
          <g className="animate-sparkle" fill="#fde68a">
            <path d="M8 18 l1.6 3.4 3.4 1.6 -3.4 1.6 -1.6 3.4 -1.6 -3.4 -3.4 -1.6 3.4 -1.6 z" />
            <path d="M62 30 l1.2 2.6 2.6 1.2 -2.6 1.2 -1.2 2.6 -1.2 -2.6 -2.6 -1.2 2.6 -1.2 z" />
          </g>
        )}

        {/* Thân ngọn lửa tròn mũm mĩm */}
        <path
          d="M36 6 C45 20 58 26 58 46 C58 62 48 74 36 74 C24 74 14 62 14 46 C14 33 23 29 27 20 C29 29 33 27 36 6 Z"
          fill={active ? 'url(#flameBody)' : '#d4d4d8'}
        />

        {/* Tay vẫy nhỏ hai bên */}
        {active && (
          <>
            <path d="M16 50 q-7 -2 -9 -8" stroke="#f97316" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M56 50 q7 -2 9 -8" stroke="#f97316" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        )}

        {active ? (
          <>
            {/* Má hồng */}
            <ellipse cx="23" cy="55" rx="4" ry="2.6" fill="#fb7185" opacity="0.7" />
            <ellipse cx="49" cy="55" rx="4" ry="2.6" fill="#fb7185" opacity="0.7" />
            {/* Mắt to long lanh */}
            <circle cx="29" cy="48" r="5" fill="#fff" />
            <circle cx="43" cy="48" r="5" fill="#fff" />
            <circle cx="30" cy="49" r="3" fill="#3f1d0b" />
            <circle cx="44" cy="49" r="3" fill="#3f1d0b" />
            <circle cx="31.2" cy="47.6" r="1.1" fill="#fff" />
            <circle cx="45.2" cy="47.6" r="1.1" fill="#fff" />
            {/* Miệng cười + lưỡi */}
            <path d="M31 58 Q36 64 41 58 Z" fill="#7c2d12" />
            <circle cx="36" cy="61.5" r="1.8" fill="#fb7185" />
          </>
        ) : (
          <>
            {/* Mắt nhắm (ngủ) */}
            <path d="M25 50 q4 3 8 0" stroke="#71717a" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M39 50 q4 3 8 0" stroke="#71717a" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M32 58 H40" stroke="#71717a" strokeWidth="2" strokeLinecap="round" />
            {/* zzz */}
            <text x="52" y="26" fontSize="10" fill="#a1a1aa" fontWeight="bold">z</text>
            <text x="59" y="18" fontSize="7" fill="#a1a1aa" fontWeight="bold">z</text>
          </>
        )}
      </svg>
    </div>
  );
}

// Badge gọn cho góc hero.
export function StreakBadge({ streak }: { streak: number }) {
  const active = streak > 0;
  return (
    <div
      className={`flex items-center gap-2 rounded-2xl px-3 py-1.5 shadow-lg ring-1 ${
        active
          ? 'bg-gradient-to-br from-amber-400 to-red-500 ring-red-500/30'
          : 'bg-zinc-100 ring-zinc-200 dark:bg-zinc-700 dark:ring-zinc-600'
      }`}
      title={active ? `Chuỗi học ${streak} ngày — giữ lửa nhé!` : 'Học hôm nay để nhóm lửa'}
    >
      <FlameBuddy active={active} />
      <div className="leading-none">
        <div
          className={`font-[family-name:var(--font-heading)] text-xl font-extrabold ${
            active ? 'text-white' : 'text-zinc-500 dark:text-zinc-300'
          }`}
        >
          {streak}
        </div>
        <div
          className={`text-[10px] font-semibold uppercase tracking-wide ${
            active ? 'text-white/90' : 'text-zinc-400'
          }`}
        >
          ngày streak
        </div>
      </div>
    </div>
  );
}
