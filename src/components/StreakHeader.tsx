import React from 'react';
import { Flame, Award, Calendar, Sparkles } from 'lucide-react';

interface StreakHeaderProps {
  streakDays: number;
  unlockedBadgeCount: number;
  totalBadgeCount: number;
  totalAttempts: number;
  onOpenBadges: () => void;
}

export const StreakHeader: React.FC<StreakHeaderProps> = ({
  streakDays,
  unlockedBadgeCount,
  totalBadgeCount,
  totalAttempts,
  onOpenBadges,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-2 pb-1">
      <div className="flex items-center justify-between gap-2 p-2 sm:px-4 sm:py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-amber-200/80 dark:border-slate-800 shadow-2xs text-xs">
        {/* Số ngày luyện liên tiếp (Streak) */}
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
              streakDays > 0
                ? 'bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
            }`}
          >
            <Flame className={`w-4 h-4 ${streakDays > 0 ? 'fill-white animate-pulse' : ''}`} />
          </div>

          <div>
            <div className="flex items-center gap-1 font-black text-slate-900 dark:text-white text-xs sm:text-sm">
              <span>{streakDays > 0 ? `Chuỗi ${streakDays} ngày liên tiếp` : 'Bắt đầu ngày đầu tiên'}</span>
              {streakDays >= 3 && <span>🔥</span>}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
              Luyện đều đặn mỗi ngày để ghi nhớ thanh điệu sâu hơn
            </span>
          </div>
        </div>

        {/* Huy hiệu & Tổng lượt thực tế */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenBadges}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 font-bold transition-all cursor-pointer"
            title="Xem danh sách huy hiệu"
          >
            <Award className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="tabular-nums font-black">
              {unlockedBadgeCount}/{totalBadgeCount}
            </span>
            <span className="hidden xs:inline text-xs font-semibold">Huy hiệu</span>
          </button>

          <div className="hidden md:flex items-center gap-1 text-slate-600 dark:text-slate-300 font-semibold px-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="tabular-nums font-black text-slate-900 dark:text-white">{totalAttempts}</span>
            <span>lượt đã luyện</span>
          </div>
        </div>
      </div>
    </div>
  );
};
