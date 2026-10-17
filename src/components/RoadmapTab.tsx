import React from 'react';
import { VIETNAMESE_TONES } from '../data/tonesData';
import { ToneId } from '../types/tones';
import { PracticeAttempt } from '../types/history';
import { getToneStatistics } from '../services/historyStorage';
import { TeacherToneSample } from '../services/teacherStorage';
import {
  Map,
  Volume2,
  Mic,
  BarChart2,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  GraduationCap,
} from 'lucide-react';

interface RoadmapTabProps {
  history: PracticeAttempt[];
  teacherSamples: Record<ToneId, TeacherToneSample>;
  onSelectToneToPractice: (toneId: ToneId) => void;
  onPlaySample: (toneId: ToneId) => void;
}

export const RoadmapTab: React.FC<RoadmapTabProps> = ({
  history,
  teacherSamples,
  onSelectToneToPractice,
  onPlaySample,
}) => {
  const { stats, recommendedToneId } = getToneStatistics(history);
  const recommendedToneDef = VIETNAMESE_TONES.find((t) => t.id === recommendedToneId) || VIETNAMESE_TONES[0];
  const recStats = stats[recommendedToneId];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header Lộ Trình */}
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-900 dark:text-orange-300 text-xs font-black uppercase tracking-wider mb-2 border border-orange-200 dark:border-orange-800">
          <Map className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
          <span>Lộ trình luyện 6 thanh điệu chuẩn tiếng Việt</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Quy Trình Học 3 Bước
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium max-w-lg mx-auto mt-1">
          Học theo từng bước: Nghe mẫu &rarr; Luyện đọc &rarr; Xem kết quả để tạo phản xạ thanh điệu tự nhiên.
        </p>
      </div>

      {/* 3 Bước Học Chuẩn: Nghe mẫu -> Luyện -> Xem kết quả */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black text-base shrink-0">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
              Bước 1
            </span>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">Nghe mẫu chuẩn</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Cảm nhận hướng đi F0 từ giọng cô hoặc mẫu mô phỏng
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-base shrink-0">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
              Bước 2
            </span>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">Luyện đọc cùng AI</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Phát âm to rõ ràng vào micro trong 1 giây
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-base shrink-0">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              Bước 3
            </span>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">Xem kết quả &amp; Góp ý</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Đối chiếu đường giọng và nhận xét ấm áp từ Bé Lạc
            </p>
          </div>
        </div>
      </div>

      {/* CARD ƯU TIÊN GỢI Ý: Thanh có điểm cao độ thấp nhất */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white rounded-3xl p-5 sm:p-6 shadow-md shadow-orange-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ưu tiên luyện tập ngay</span>
              </span>
              <span className="text-xs font-bold text-amber-100">
                (Thanh cần cải thiện nhất)
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{recommendedToneDef.name}</span>
              <span className="text-amber-200 font-bold text-lg">
                (&ldquo;{recommendedToneDef.examples.ma.word}&rdquo; {recommendedToneDef.arrowSymbol})
              </span>
            </h3>

            <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed max-w-lg">
              {recStats.totalAttempts === 0
                ? 'Em chưa luyện thanh này lần nào. Hãy bắt đầu ngay để hoàn thành trọn bộ 6 thanh điệu nhé!'
                : `Thanh này đang có điểm cao độ trung bình thấp nhất (${recStats.averageSimilarity || 0}/100 điểm). Luyện tập thêm để nâng cao độ chính xác nào!`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelectToneToPractice(recommendedToneId)}
            className="px-5 py-3 rounded-2xl bg-white hover:bg-amber-50 text-slate-900 font-black text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 self-stretch sm:self-auto shrink-0 active:scale-95"
          >
            <span>Luyện ngay thanh này</span>
            <ArrowRight className="w-4 h-4 text-orange-600" />
          </button>
        </div>
      </div>

      {/* DANH SÁCH 6 THANH VÀ TIẾN ĐỘ THỰC TẾ:
          "Chỉ nhận xét một thanh khi đã có ít nhất 3 lượt hợp lệ." */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Chi tiết lộ trình 6 thanh điệu
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            Yêu cầu: &ge; 3 lượt hợp lệ để mở khóa nhận xét
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {VIETNAMESE_TONES.map((tone) => {
            const toneStat = stats[tone.id];
            const hasTeacher = Boolean(teacherSamples[tone.id]);
            const isRecommended = tone.id === recommendedToneId;

            return (
              <div
                key={tone.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 transition-all flex flex-col justify-between ${
                  isRecommended
                    ? 'border-orange-400 dark:border-orange-500 shadow-md ring-2 ring-orange-200/60 dark:ring-orange-950/60'
                    : 'border-slate-200/80 dark:border-slate-800 shadow-2xs'
                }`}
              >
                {/* Header card: Name, Arrow, Status badge */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xs shrink-0 ${tone.theme.arrowBg}`}
                    >
                      {tone.arrowSymbol}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-lg font-black text-slate-900 dark:text-white">
                          {tone.name}
                        </h4>
                        <span className="text-xs font-black text-orange-600 dark:text-orange-400">
                          &ldquo;{tone.examples.ma.word}&rdquo;
                        </span>
                        {hasTeacher && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            Có giọng cô
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {tone.arrowDirectionLabel}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block">
                      Đã đọc
                    </span>
                    <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                      {toneStat.validPitchAttempts}/3{' '}
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">hợp lệ</span>
                    </span>
                  </div>
                </div>

                {/* Score & Progress Feedback */}
                <div className="my-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs">
                  <div className="flex items-center justify-between mb-1.5 font-bold">
                    <span className="text-slate-600 dark:text-slate-300">Điểm cao độ trung bình:</span>
                    <span
                      className={`text-sm font-black tabular-nums ${
                        toneStat.averageSimilarity !== null
                          ? toneStat.averageSimilarity >= 75
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-orange-600 dark:text-orange-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {toneStat.averageSimilarity !== null ? `${toneStat.averageSimilarity}/100` : '-- / 100'}
                    </span>
                  </div>

                  {/* Lời nhận xét: CHỈ NHẬN XÉT KHI ĐÃ CÓ ÍT NHẤT 3 LƯỢT HỢP LỆ */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 font-medium">
                    {toneStat.hasEnoughValidAttempts ? (
                      <div className="text-emerald-900 dark:text-emerald-300 flex items-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{toneStat.progressFeedback}</span>
                      </div>
                    ) : (
                      <div className="text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span>{toneStat.progressFeedback}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions: Nghe mẫu & Luyện ngay */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => onPlaySample(tone.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                    <span>Nghe mẫu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectToneToPractice(tone.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <span>Luyện ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
