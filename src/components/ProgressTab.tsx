import React, { useState } from 'react';
import { VIETNAMESE_TONES } from '../data/tonesData';
import { PracticeAttempt } from '../types/history';
import {
  getToneStatistics,
  getAllBadges,
  getDailyProgress,
  calculateStreak,
} from '../services/historyStorage';
import {
  BarChart3,
  Award,
  Flame,
  Calendar,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';

interface ProgressTabProps {
  history: PracticeAttempt[];
  onClearHistory: () => void;
  onOpenBadgesModal: () => void;
}

export const ProgressTab: React.FC<ProgressTabProps> = ({
  history,
  onClearHistory,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const { stats, totalAttempts, totalValidPitchAttempts } = getToneStatistics(history);
  const streakDays = calculateStreak(history);
  const badges = getAllBadges(history);
  const unlockedBadges = badges.filter((b) => b.unlocked);
  const dailyProgress = getDailyProgress(history);

  const handleConfirmDelete = () => {
    onClearHistory();
    setShowConfirmDelete(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6 pb-28">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-2 border border-emerald-200 dark:border-emerald-800">
          <BarChart3 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
          <span>Theo dõi sự tiến bộ dựa trên dữ liệu thật</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Bảng Tiến Độ Luyện Tập
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium max-w-lg mx-auto mt-1">
          Dữ liệu lưu an toàn trên máy của bạn. Lượt AI chưa chắc chắn không tính là lượt sai.
        </p>
      </div>

      {/* 4 Chỉ Số Tổng Quan Thực Tế */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs text-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
            Tổng lượt luyện
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
            {totalAttempts}
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">lượt thực tế</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs text-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
            Đo cao độ hợp lệ
          </span>
          <div className="text-2xl sm:text-3xl font-black text-orange-600 dark:text-orange-400 tabular-nums">
            {totalValidPitchAttempts}
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">lượt tách được F0</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs text-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
            Chuỗi ngày luyện
          </span>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tabular-nums flex items-center justify-center gap-1">
            <span>{streakDays}</span>
            <Flame className="w-5 h-5 fill-rose-500 text-rose-500" />
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">ngày liên tiếp</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs text-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
            Huy hiệu đạt được
          </span>
          <div className="text-2xl sm:text-3xl font-black text-amber-500 tabular-nums flex items-center justify-center gap-1">
            <span>{unlockedBadges.length}</span>
            <Award className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">/{badges.length} huy hiệu</span>
        </div>
      </div>

      {/* ĐIỂM TRUNG BÌNH TỪNG THANH */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Điểm tương đồng trung bình từng thanh
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Chỉ tính từ những lượt phát âm có tín hiệu cao độ hợp lệ
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            Thang điểm 100
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {VIETNAMESE_TONES.map((tone) => {
            const s = stats[tone.id];
            const hasScore = s.averageSimilarity !== null;
            return (
              <div
                key={tone.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-base shadow-2xs ${tone.theme.arrowBg}`}
                  >
                    {tone.arrowSymbol}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                      {tone.name}
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      {s.validPitchAttempts} lượt hợp lệ
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-lg sm:text-xl font-black tabular-nums block ${
                      hasScore
                        ? (s.averageSimilarity || 0) >= 75
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-orange-600 dark:text-orange-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {hasScore ? `${s.averageSimilarity}` : '--'}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                    /100
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BIỂU ĐỒ TIẾN BỘ THEO NGÀY */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span>Biểu đồ tiến bộ theo ngày</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Điểm số trung bình và số lượt luyện theo từng ngày
            </p>
          </div>
        </div>

        {dailyProgress.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
            Chưa có đủ dữ liệu theo ngày. Hãy luyện tập để theo dõi biểu đồ tiến bộ tại đây nhé!
          </div>
        ) : (
          <div className="pt-2">
            <div className="h-44 sm:h-52 w-full flex items-end gap-3 sm:gap-6 px-4 pb-4 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
              {dailyProgress.map((day) => {
                const score = day.averageScore || 0;
                const heightPercent = Math.max(12, Math.min(100, score));
                return (
                  <div key={day.dateStr} className="flex flex-col items-center gap-1.5 flex-1 min-w-[48px]">
                    <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 tabular-nums">
                      {score > 0 ? `${score}đ` : '--'}
                    </span>

                    <div className="w-8 sm:w-10 h-32 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-end p-0.5">
                      <div
                        className="w-full rounded-lg bg-gradient-to-t from-orange-500 to-amber-400 transition-all duration-700 shadow-2xs"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>

                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {day.displayDate}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      ({day.attemptsCount} lượt)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* DANH SÁCH HUY HIỆU */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Huy hiệu thành tích</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Đạt các cột mốc luyện tập để mở khóa huy hiệu
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            {unlockedBadges.length}/{badges.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                b.unlocked
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/20 border-amber-300 dark:border-amber-800 shadow-2xs'
                  : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-2xs ${
                  b.unlocked ? 'bg-amber-400 text-white animate-bounce' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                }`}
              >
                {b.icon}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    {b.title}
                  </h4>
                  {b.unlocked && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5 leading-snug">
                  {b.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NHẬT KÝ CÁC LƯỢT LUYỆN GẦN NHẤT */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Nhật ký các lượt luyện thực tế
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Lưu trên thiết bị của bạn · Tải lại trang vẫn còn
            </p>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa lịch sử</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
            Chưa có lượt luyện tập nào được ghi nhận. Hãy sang tab &ldquo;Luyện đọc&rdquo; và bấm micro nhé!
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {history.slice(0, 15).map((att) => {
              const toneDef = VIETNAMESE_TONES.find((t) => t.id === att.targetToneId);
              const dateFormatted = new Date(att.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={att.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 font-black flex items-center justify-center text-xs">
                      {toneDef?.arrowSymbol}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 dark:text-white">
                          {toneDef?.name} ({att.targetWord})
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">· {dateFormatted}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {att.isAiConfident ? `AI nghe: ${att.detectedToneId}` : 'AI chưa chắc chắn (không tính là sai)'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-black tabular-nums text-sm block ${
                        att.similarityScore !== null
                          ? att.similarityScore >= 75
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-orange-600 dark:text-orange-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {att.similarityScore !== null ? `${att.similarityScore}/100` : 'Chưa đo F0'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* HỘP THOẠI XÁC NHẬN XÓA LỊCH SỬ (CÓ HỎI LẠI TRƯỚC KHI XÓA) */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Xóa toàn bộ lịch sử?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Bạn có chắc chắn muốn xóa tất cả lượt luyện tập và huy hiệu đã lưu trên máy không? Dữ liệu đã xóa sẽ không thể phục hồi.
            </p>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-xs cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
