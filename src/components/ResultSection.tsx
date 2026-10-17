import React from 'react';
import {
  Sparkles,
  BarChart2,
  RotateCcw,
  AlertCircle,
  VolumeX,
} from 'lucide-react';
import { ToneDefinition } from '../types/tones';
import { PredictionResult } from '../services/teachableMachine';
import { PitchAnalysisResult } from '../services/audioPitchDetector';
import { TeacherToneSample } from '../services/teacherStorage';
import { SimilarityScoreResult } from '../services/pitchSimilarity';
import { generateIntegratedFeedback } from '../services/integratedFeedback';
import { IntegratedFeedbackBanner } from './IntegratedFeedbackBanner';
import { LearnerPitchChart } from './LearnerPitchChart';
import { PitchSimilarityCard } from './PitchSimilarityCard';

interface ResultSectionProps {
  currentTone: ToneDefinition;
  currentWord: string;
  prediction: PredictionResult | null;
  pitchResult: PitchAnalysisResult | null;
  similarityResult: SimilarityScoreResult | null;
  teacherSample?: TeacherToneSample;
  errorMessage: string | null;
  isLoadingModel: boolean;
  isListening: boolean;
  onReset: () => void;
  onPlaySampleAgain: () => void;
  onRetry: () => void;
}

export const ResultSection: React.FC<ResultSectionProps> = ({
  currentTone,
  currentWord,
  prediction,
  pitchResult,
  similarityResult,
  teacherSample,
  errorMessage,
  isLoadingModel,
  isListening,
  onReset,
  onPlaySampleAgain,
  onRetry,
}) => {
  const hasTeacher = Boolean(teacherSample && teacherSample.audioDataUrl);

  // Tạo lời nhận xét gộp theo 5 quy tắc đề bài
  const integratedFeedback = prediction
    ? generateIntegratedFeedback(
        prediction,
        pitchResult,
        similarityResult,
        currentTone,
        currentWord
      )
    : null;

  return (
    <section
      aria-label="Khu vực hiển thị kết quả"
      className="w-full max-w-3xl mx-auto my-6 px-4"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-slate-200/90 dark:border-slate-800 shadow-sm transition-all">
        {/* Section Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold shadow-xs">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                Khu vực hiển thị kết quả AI &amp; Nhận xét
              </h2>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Gộp kết quả AI đoán thanh và cao độ F0 thành lời nhận xét thống nhất
              </span>
            </div>
          </div>

          {(prediction || errorMessage || pitchResult) && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa kết quả</span>
            </button>
          )}
        </div>

        {/* 1. THÔNG BÁO LỖI TIẾNG VIỆT NẾU KHÔNG CẤP MICRO HOẶC KHÔNG TẢI ĐƯỢC MÔ HÌNH */}
        {errorMessage ? (
          <div className="py-6">
            <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-900 rounded-2xl p-5 sm:p-6 text-rose-950 dark:text-rose-200">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 shrink-0 mt-0.5">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-black text-rose-900 dark:text-rose-200">
                    Chưa thể nhận diện giọng nói
                  </h3>
                  <p className="text-xs sm:text-sm text-rose-800 dark:text-rose-300 font-medium mt-1 leading-relaxed">
                    {errorMessage}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={onRetry}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      Thử lại ngay
                    </button>
                    <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                      (Bấm biểu tượng Khóa 🔒 trên thanh địa chỉ nếu bị chặn micro)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : isListening ? (
          /* TRẠNG THÁI ĐANG NGHE KHOẢNG 1 GIÂY */
          <div className="py-10 text-center flex flex-col items-center justify-center">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-4">
              <span className="absolute inset-0 rounded-full bg-orange-300 dark:bg-orange-600 animate-ping opacity-40" />
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 animate-spin" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Đang nghe, nhận diện và đo cao độ...
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              Phân tích thanh điệu Teachable Machine &amp; tính toán điểm tương đồng F0
            </p>
          </div>
        ) : !prediction ? (
          /* TRẠNG THÁI TẠM THỜI ĐỂ TRỐNG KHI CHƯA BẤM ĐỌC */
          <div className="py-10 sm:py-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border-2 border-dashed border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-500 dark:text-amber-400 mb-4 shadow-inner">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 opacity-70" />
            </div>

            <h3 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-200 mb-1">
              Chưa có kết quả đọc
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed font-medium mb-6">
              Hãy chọn 1 thanh điệu ở trên và bấm nút micro to{' '}
              <span className="font-bold text-orange-600 dark:text-orange-400">&ldquo;BẤM ĐỂ ĐỌC&rdquo;</span>.
              Hệ thống sẽ tổng hợp kết quả AI và đường cao độ thành lời nhận xét ấm áp cho bé!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl text-left">
              <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                  1. Độ tin cậy chặt chẽ
                </span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1 block">
                  AI chắc chắn khi đạt &ge; 70% và hơn thanh nhì &ge; 15%
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                  2. Khớp cao độ &ge; 40
                </span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1 block">
                  Đảm bảo AI nghe đúng và đường lượn giọng thực sự khớp mẫu
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                  3. Nhận xét ấm áp
                </span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1 block">
                  Ngắn gọn, dễ thương, hướng dẫn cụ thể cách uốn giọng cho bé
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* TRẠNG THÁI HIỂN THỊ KẾT QUẢ GỘP NHẬN XÉT, BIỂU ĐỒ VÀ MỨC ĐỘ TIN CẬY */
          <div className="py-6 space-y-6">
            {/* LỜI NHẬN XÉT GỘP THEO 5 QUY TẮC ĐỀ BÀI */}
            <IntegratedFeedbackBanner
              feedback={integratedFeedback}
              onPlaySampleAgain={onPlaySampleAgain}
              targetWord={currentWord}
            />

            {/* CARD CHẤM ĐIỂM TƯƠNG ĐỒNG CAO ĐỘ (0 - 100) VÀ VẼ 2 ĐƯỜNG TRÊN CÙNG BIỂU ĐỒ */}
            <PitchSimilarityCard
              similarity={similarityResult}
              targetTone={currentTone}
              word={currentWord}
              teacherSample={teacherSample}
            />

            {/* THÔNG SỐ ĐO CAO ĐỘ GỐC (F0 HERTZ) */}
            <LearnerPitchChart
              pitchResult={pitchResult}
              targetTone={currentTone}
              word={currentWord}
              teacherSample={teacherSample}
            />

            {/* MỨC ĐỘ TIN CẬY CỦA CẢ 6 THANH BẰNG 6 THANH MÀU DÀI NGẮN KHÁC NHAU */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Mức độ tin cậy của 6 thanh điệu (Teachable Machine)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    AI xác nhận chắc chắn khi &ge; 70% và hơn thanh thứ hai &ge; 15%
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  Tỷ lệ %
                </span>
              </div>

              {/* 6 thanh màu dài ngắn khác nhau */}
              <div className="space-y-3.5">
                {prediction.scores.map((item) => {
                  return (
                    <div key={item.toneId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-md flex items-center justify-center text-white text-xs font-black shadow-2xs"
                            style={{ backgroundColor: item.colorHex }}
                          >
                            {item.arrowSymbol}
                          </span>
                          <span className="text-slate-900 dark:text-white font-black">
                            {item.word}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            ({item.toneName})
                          </span>
                          {item.isTarget && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              Mục tiêu
                            </span>
                          )}
                          {item.isWinner && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              AI chọn
                            </span>
                          )}
                        </div>

                        <span
                          className={`tabular-nums text-xs sm:text-sm font-black ${
                            item.isWinner ? 'text-slate-950 dark:text-white scale-105' : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {item.percentage}%
                        </span>
                      </div>

                      {/* Thanh màu dài ngắn theo tỷ lệ phần trăm */}
                      <div className="w-full h-4 sm:h-5 bg-slate-200/80 dark:bg-slate-700/80 rounded-full overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out shadow-xs"
                          style={{
                            width: `${Math.max(item.percentage, 3)}%`,
                            backgroundColor: item.colorHex,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tiếng ồn nền (Background Noise) */}
              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <VolumeX className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span>Tiếng ồn nền (Background Noise):</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 sm:w-28 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-400 dark:bg-slate-500 rounded-full"
                      style={{ width: `${prediction.noisePercentage}%` }}
                    />
                  </div>
                  <span className="font-bold tabular-nums text-slate-700 dark:text-slate-300">
                    {prediction.noisePercentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
