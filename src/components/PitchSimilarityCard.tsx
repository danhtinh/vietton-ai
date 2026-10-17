import React from 'react';
import { SimilarityScoreResult } from '../services/pitchSimilarity';
import { ToneDefinition } from '../types/tones';
import { TeacherToneSample } from '../services/teacherStorage';
import { Award, CheckCircle2, AlertCircle, Sparkles, GraduationCap, ArrowRight } from 'lucide-react';

interface PitchSimilarityCardProps {
  similarity: SimilarityScoreResult | null;
  targetTone: ToneDefinition;
  word: string;
  teacherSample?: TeacherToneSample;
}

export const PitchSimilarityCard: React.FC<PitchSimilarityCardProps> = ({
  similarity,
  targetTone,
  word,
  teacherSample,
}) => {
  if (!similarity) return null;

  const hasTeacher = Boolean(teacherSample && teacherSample.pitchPoints && teacherSample.pitchPoints.length > 0);

  // TRƯỜNG HỢP 1: CHƯA ĐO ĐƯỢC CAO ĐỘ HOẶC CHƯA CÓ MẪU -> KHÔNG CHO ĐIỂM, NÓI RÕ LÝ DO
  if (!similarity.hasScore) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/60 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 text-slate-700 dark:text-slate-300 my-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              Chưa thể chấm điểm tương đồng cao độ
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1 leading-relaxed">
              <span className="font-bold">Lý do: </span>
              {similarity.noScoreReason || 'Chưa đủ dữ liệu cao độ hợp lệ để thực hiện so sánh.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // TRƯỜNG HỢP 2: ĐÃ ĐO THÀNH CÔNG -> HIỂN THỊ ĐIỂM 3 PHẦN & VẼ 2 ĐƯỜNG TRÊN CÙNG BIỂU ĐỒ
  const { totalScore, shapeScore, directionScore, timeAlignmentScore, normalizedLearner, normalizedTarget } = similarity;

  // SVG Geometry cho biểu đồ so sánh 2 đường
  const width = 340;
  const height = 150;
  const padLeft = 35;
  const padRight = 35;
  const padTop = 20;
  const padBottom = 26;

  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  // Chuyển mảng normalized (0-100) sang tọa độ SVG (Y đảo ngược: 100 ở trên, 0 ở dưới)
  const learnerCoords = normalizedLearner.map((p) => ({
    x: padLeft + (p.x / 100) * innerW,
    y: padTop + (1 - p.y / 100) * innerH,
  }));

  const targetCoords = normalizedTarget.map((p) => ({
    x: padLeft + (p.x / 100) * innerW,
    y: padTop + (1 - p.y / 100) * innerH,
  }));

  const learnerPathD = learnerCoords.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = learnerCoords[idx - 1];
    const cpX = (prev.x + curr.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }, '');

  const targetPathD = targetCoords.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = targetCoords[idx - 1];
    const cpX = (prev.x + curr.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }, '');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border-2 border-orange-200/90 dark:border-slate-800 shadow-sm my-5">
      {/* Title & Score Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                Độ tương đồng cao độ giọng đọc
              </h3>
              {hasTeacher ? (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  So với giọng cô
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  So với mẫu mô phỏng
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Đã chuẩn hóa âm vực (nam/nữ/trẻ em) &amp; tốc độ đọc để so sánh công bằng
            </p>
          </div>
        </div>

        {/* Điểm tổng số 0 - 100 */}
        <div className="flex flex-col items-start sm:items-end">
          <div className="flex items-baseline gap-1">
            <span
              className={`text-4xl sm:text-5xl font-black tabular-nums tracking-tight ${
                totalScore >= 80
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : totalScore >= 60
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {totalScore}
            </span>
            <span className="text-base font-extrabold text-slate-400 dark:text-slate-500">/100</span>
          </div>
        </div>
      </div>

      {/* DÒNG CHỮ BẮT BUỘC THEO ĐỀ BÀI NGAY DƯỚI ĐIỂM */}
      <div className="py-2.5 px-3.5 my-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/60 text-xs font-semibold text-amber-950 dark:text-amber-200 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
        <span className="italic">
          Điểm cho biết đường cao độ giống mẫu bao nhiêu, không phải điểm phát âm đúng tuyệt đối.
        </span>
      </div>

      {/* VẼ ĐƯỜNG CỦA NGƯỜI HỌC VÀ ĐƯỜNG MẪU TRÊN CÙNG MỘT BIỂU ĐỒ (2 MÀU KHÁC NHAU) */}
      <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 my-4">
        <div className="flex items-center justify-between mb-3 text-xs font-bold flex-wrap gap-2">
          <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
            Biểu đồ chồng hai đường cao độ (Đã căn chỉnh thời gian &amp; âm vực)
          </span>

          <div className="flex items-center gap-4">
            {/* Màu 1: Đường của người học */}
            <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
              <span className="w-3.5 h-1.5 rounded-full bg-orange-500 inline-block" />
              <span>Giọng của bạn</span>
            </div>

            {/* Màu 2: Đường mẫu */}
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <span className="w-3.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
              <span>{hasTeacher ? 'Mẫu giọng cô' : 'Mẫu mô phỏng'}</span>
            </div>
          </div>
        </div>

        <div className="relative w-full overflow-hidden select-none">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 sm:h-48 overflow-visible">
            {/* Lưới tọa độ ngang */}
            {[1, 0.75, 0.5, 0.25, 0].map((r) => {
              const y = padTop + (1 - r) * innerH;
              return (
                <line
                  key={r}
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
              );
            })}

            {/* Trục nhãn Y: Cao / Vừa / Trầm */}
            <text x={padLeft - 6} y={padTop + 3} textAnchor="end" fontSize="8" className="fill-slate-400 font-bold">
              Cao
            </text>
            <text x={padLeft - 6} y={padTop + innerH / 2 + 3} textAnchor="end" fontSize="8" className="fill-slate-400 font-bold">
              Vừa
            </text>
            <text x={padLeft - 6} y={padTop + innerH + 3} textAnchor="end" fontSize="8" className="fill-slate-400 font-bold">
              Trầm
            </text>

            {/* 1. ĐƯỜNG MẪU (Màu Xanh Ngọc Lục Bảo #059669) */}
            <path
              d={targetPathD}
              fill="none"
              stroke="#059669"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 2. ĐƯỜNG NGƯỜI HỌC (Màu Cam Đào Rực Rỡ #ea580c) */}
            <path
              d={learnerPathD}
              fill="none"
              stroke="#ea580c"
              strokeWidth="4"
              strokeDasharray={totalScore < 60 ? '5 3' : 'none'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Điểm bắt đầu và kết thúc của người học */}
            {learnerCoords.length > 0 && (
              <>
                <circle
                  cx={learnerCoords[0].x}
                  cy={learnerCoords[0].y}
                  r="4"
                  fill="#ffffff"
                  stroke="#ea580c"
                  strokeWidth="2.5"
                />
                <circle
                  cx={learnerCoords[learnerCoords.length - 1].x}
                  cy={learnerCoords[learnerCoords.length - 1].y}
                  r="4.5"
                  fill="#ffffff"
                  stroke="#ea580c"
                  strokeWidth="2.5"
                />
              </>
            )}

            {/* Trục nhãn thời gian X */}
            <text x={padLeft} y={height - 6} fontSize="8" className="fill-slate-400 font-semibold">
              Bắt đầu âm
            </text>
            <text x={width - padRight} y={height - 6} textAnchor="end" fontSize="8" className="fill-slate-400 font-semibold">
              Kết thúc âm
            </text>
          </svg>
        </div>
      </div>

      {/* 3 PHẦN ĐIỂM CHI TIẾT THEO YÊU CẦU ĐỀ BÀI: 45% - 30% - 25% */}
      <div className="space-y-3.5 mt-4">
        <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
          Chi tiết 3 thành phần điểm tương đồng:
        </h4>

        {/* Tiêu chí 1: Giống hình dáng (45%) */}
        <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1.5">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-slate-800 dark:text-slate-200">
              1. Giống hình dáng đường đi (lên, xuống, võng):
            </span>
            <span className="text-slate-900 dark:text-white font-black tabular-nums">
              {shapeScore} <span className="text-slate-400 dark:text-slate-500 font-normal">/ 45 điểm</span>
            </span>
          </div>
          <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-700"
              style={{ width: `${(shapeScore / 45) * 100}%` }}
            />
          </div>
        </div>

        {/* Tiêu chí 2: Đúng chiều lên hay xuống từ đầu đến cuối (30%) */}
        <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1.5">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-slate-800 dark:text-slate-200">
              2. Đúng chiều lên hay xuống từ đầu đến cuối:
            </span>
            <span className="text-slate-900 dark:text-white font-black tabular-nums">
              {directionScore} <span className="text-slate-400 dark:text-slate-500 font-normal">/ 30 điểm</span>
            </span>
          </div>
          <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${(directionScore / 30) * 100}%` }}
            />
          </div>
        </div>

        {/* Tiêu chí 3: Khớp nhau sau khi căn thời gian (25%) */}
        <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1.5">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-slate-800 dark:text-slate-200">
              3. Khớp nhau sau khi căn thời gian (đọc nhanh/chậm):
            </span>
            <span className="text-slate-900 dark:text-white font-black tabular-nums">
              {timeAlignmentScore} <span className="text-slate-400 dark:text-slate-500 font-normal">/ 25 điểm</span>
            </span>
          </div>
          <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${(timeAlignmentScore / 25) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lời nhận xét tổng kết */}
      {similarity.feedbackText && (
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium border border-slate-200/60 dark:border-slate-700">
          <span className="font-bold text-slate-900 dark:text-white">Nhận xét: </span>
          {similarity.feedbackText}
        </div>
      )}
    </div>
  );
};
