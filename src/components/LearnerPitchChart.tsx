import React from 'react';
import { PitchAnalysisResult } from '../services/audioPitchDetector';
import { ToneDefinition } from '../types/tones';
import { TeacherToneSample } from '../services/teacherStorage';
import { TrendingUp, Activity, MicOff, GraduationCap, Sparkles } from 'lucide-react';

interface LearnerPitchChartProps {
  pitchResult: PitchAnalysisResult | null;
  targetTone: ToneDefinition;
  word: string;
  teacherSample?: TeacherToneSample;
}

export const LearnerPitchChart: React.FC<LearnerPitchChartProps> = ({
  pitchResult,
  targetTone,
  word,
  teacherSample,
}) => {
  if (!pitchResult) return null;

  const hasTeacher = Boolean(teacherSample && teacherSample.pitchPoints && teacherSample.pitchPoints.length > 0);

  // TRƯỜNG HỢP 1: KHÔNG ĐO ĐƯỢC CAO ĐỘ (QUÁ NGẮN, QUÁ NHỎ HOẶC NHIỄU)
  // ĐỀ BÀI: "Nếu đoạn đọc quá ngắn hoặc quá nhỏ để đo, báo ‘Chưa đo được cao độ’ và nói lý do bằng tiếng Việt, không tự vẽ đường."
  if (pitchResult.status === 'error') {
    return (
      <div className="bg-amber-50/90 dark:bg-amber-950/40 border-2 border-dashed border-amber-300 dark:border-amber-800 rounded-3xl p-5 sm:p-6 text-amber-950 dark:text-amber-200 my-4 transition-all">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
            <MicOff className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-black text-amber-900 dark:text-amber-200">
                Chưa đo được cao độ giọng nói
              </h4>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                Không vẽ đường
              </span>
            </div>
            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 font-medium mt-1.5 leading-relaxed">
              <span className="font-bold">Lý do: </span>
              {pitchResult.errorMessage || 'Âm lượng quá nhỏ hoặc tiếng phát âm quá ngắn để tách tần số thanh quản.'}
            </p>
            <div className="mt-3 text-xs text-amber-700 dark:text-amber-300 font-medium bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/60">
              💡 <span className="font-bold">Mẹo:</span> Hãy nhấn lại nút micro, nói to rõ ràng và ngân dài âm &ldquo;{word}&rdquo; trong khoảng nửa giây để máy đo được trọn vẹn đường đi của giọng nhé!
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TRƯỜNG HỢP 2: ĐO THÀNH CÔNG -> VẼ ĐƯỜNG CAO ĐỘ GIỌNG NÓI THỰC TẾ & ĐƯỜNG MẪU ĐỐI CHIẾU
  const points = pitchResult.points;
  if (!points || points.length === 0) return null;

  const width = 360;
  const height = 160;
  const padLeft = 45;
  const padRight = 35;
  const padTop = 22;
  const padBottom = 30;

  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  // Min and max Hz with padding
  const allLearnerHz = points.map((p) => p.pitchHz);
  const minHz = Math.min(...allLearnerHz);
  const maxHz = Math.max(...allLearnerHz);
  const chartMinHz = Math.max(60, minHz - 20);
  const chartMaxHz = maxHz + 20;
  const chartHzSpan = Math.max(50, chartMaxHz - chartMinHz);

  // Time boundaries
  const startTime = points[0].timeSec;
  const endTime = points[points.length - 1].timeSec;
  const timeSpan = Math.max(0.1, endTime - startTime);

  // Map learner data points to SVG coordinates
  const svgCoords = points.map((p) => {
    const x = padLeft + ((p.timeSec - startTime) / timeSpan) * innerW;
    const y = padTop + (1 - (p.pitchHz - chartMinHz) / chartHzSpan) * innerH;
    return { x, y, hz: p.pitchHz, time: p.timeSec };
  });

  const pathD = svgCoords.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = svgCoords[idx - 1];
    const cpX = (prev.x + curr.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }, '');

  const areaD = `${pathD} L ${svgCoords[svgCoords.length - 1].x} ${padTop + innerH} L ${svgCoords[0].x} ${padTop + innerH} Z`;

  // Tạo đường đối chiếu mẫu (Mẫu giáo viên nếu có, hoặc mẫu mô phỏng chuẩn)
  let refPathD = '';
  if (hasTeacher && teacherSample) {
    const tPoints = teacherSample.pitchPoints;
    const tStepX = innerW / Math.max(1, tPoints.length - 1);
    const tCoords = tPoints.map((p, idx) => {
      const x = padLeft + idx * tStepX;
      const y = padTop + (1 - (p.pitchHz - chartMinHz) / chartHzSpan) * innerH;
      return { x, y: Math.max(padTop, Math.min(padTop + innerH, y)) };
    });
    refPathD = tCoords.reduce((acc, curr, idx) => {
      if (idx === 0) return `M ${curr.x} ${curr.y}`;
      const prev = tCoords[idx - 1];
      const cpX = (prev.x + curr.x) / 2;
      return `${acc} C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }, '');
  } else {
    // Mẫu mô phỏng chuẩn (5 bậc tỉ lệ trong quãng giọng)
    const simPoints = targetTone.pitchPoints;
    const sStepX = innerW / (simPoints.length - 1);
    const sCoords = simPoints.map((p, idx) => {
      const x = padLeft + idx * sStepX;
      // Ánh xạ 1-5 bậc tương quan với khoảng F0 của người học
      const normalizedRatio = (p - 1) / 4;
      const targetHz = chartMinHz + 15 + normalizedRatio * (chartHzSpan - 30);
      const y = padTop + (1 - (targetHz - chartMinHz) / chartHzSpan) * innerH;
      return { x, y };
    });
    refPathD = sCoords.reduce((acc, curr, idx) => {
      if (idx === 0) return `M ${curr.x} ${curr.y}`;
      const prev = sCoords[idx - 1];
      const cpX = (prev.x + curr.x) / 2;
      return `${acc} C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }, '');
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border-2 border-slate-200/90 dark:border-slate-800 shadow-sm my-4">
      {/* Chart Title & Direction Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
              So sánh đường cao độ giọng đọc với mẫu chuẩn
            </h4>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              Đo theo thời gian dao động dây thanh quản (75 Hz - 500 Hz)
            </span>
          </div>
        </div>

        {pitchResult.movementDescription && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 text-xs font-black text-orange-900 dark:text-orange-300 self-start sm:self-auto">
            <TrendingUp className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span>{pitchResult.movementDescription}</span>
          </div>
        )}
      </div>

      {/* Legend identifying user curve vs reference curve */}
      <div className="flex items-center gap-4 flex-wrap text-xs font-bold mb-2 px-1">
        <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
          <span className="w-4 h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 inline-block" />
          <span>Giọng của bạn (thực tế)</span>
        </div>

        {hasTeacher ? (
          <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
            <span className="w-4 h-1 rounded-full bg-emerald-600 border border-emerald-700 inline-block" />
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Mẫu giọng giáo viên ({teacherSample?.startHz}Hz &rarr; {teacherSample?.endHz}Hz)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="w-4 h-1 border-t-2 border-dashed border-slate-400 inline-block" />
            <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
            <span>Mẫu mô phỏng chuẩn ({targetTone.name})</span>
          </div>
        )}
      </div>

      {/* SVG Canvas for Pitch Contour */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44 sm:h-52 overflow-visible"
        >
          <defs>
            <linearGradient id="learnerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <linearGradient id="learnerArea" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines & Hz ticks */}
          {[1, 0.75, 0.5, 0.25, 0].map((ratio) => {
            const y = padTop + (1 - ratio) * innerH;
            const hzVal = Math.round(chartMinHz + ratio * chartHzSpan);
            return (
              <g key={ratio}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="8"
                  className="fill-slate-400 font-bold tabular-nums"
                >
                  {hzVal}Hz
                </text>
              </g>
            );
          })}

          {/* ĐƯỜNG MẪU ĐỐI CHIẾU (GIÁO VIÊN HOẶC MÔ PHỎNG) */}
          {refPathD && (
            <path
              d={refPathD}
              fill="none"
              stroke={hasTeacher ? '#059669' : '#94a3b8'}
              strokeWidth={hasTeacher ? 3 : 2}
              strokeDasharray={hasTeacher ? 'none' : '5 4'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Area fill under learner curve */}
          <path d={areaD} fill="url(#learnerArea)" />

          {/* ĐƯỜNG CAO ĐỘ THỰC TẾ CỦA HỌC SINH */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#learnerGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Key points on curve */}
          {svgCoords.map((c, i) => {
            const isStart = i === 0;
            const isEnd = i === svgCoords.length - 1;
            if (!isStart && !isEnd && i % 4 !== 0) return null;

            return (
              <circle
                key={i}
                cx={c.x}
                cy={c.y}
                r={isStart || isEnd ? 4.5 : 2.5}
                fill="#ffffff"
                stroke="#f97316"
                strokeWidth={isStart || isEnd ? 2.5 : 1.5}
              />
            );
          })}

          {/* Start & End Hz Callouts */}
          <text
            x={svgCoords[0].x}
            y={svgCoords[0].y - 8}
            fontSize="9"
            fontWeight="bold"
            fill="#ea580c"
            textAnchor="middle"
          >
            {pitchResult.startHz}Hz
          </text>
          <text
            x={svgCoords[svgCoords.length - 1].x}
            y={svgCoords[svgCoords.length - 1].y - 8}
            fontSize="9"
            fontWeight="bold"
            fill="#db2777"
            textAnchor="middle"
          >
            {pitchResult.endHz}Hz
          </text>

          {/* X-axis time label */}
          <text
            x={width / 2}
            y={height - 6}
            textAnchor="middle"
            fontSize="8"
            className="fill-slate-400 font-semibold"
          >
            Thời gian phát âm (~{Math.round(timeSpan * 1000)}ms)
          </text>
        </svg>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-100 text-center">
        <div className="bg-slate-50 p-2.5 rounded-xl">
          <span className="text-[10px] uppercase font-black text-slate-400 block">
            Bắt đầu
          </span>
          <span className="text-sm font-black text-slate-800 tabular-nums">
            {pitchResult.startHz} Hz
          </span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl">
          <span className="text-[10px] uppercase font-black text-slate-400 block">
            Kết thúc
          </span>
          <span className="text-sm font-black text-slate-800 tabular-nums">
            {pitchResult.endHz} Hz
          </span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl">
          <span className="text-[10px] uppercase font-black text-slate-400 block">
            Cao nhất (Đỉnh)
          </span>
          <span className="text-sm font-black text-orange-600 tabular-nums">
            {pitchResult.maxHz} Hz
          </span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl">
          <span className="text-[10px] uppercase font-black text-slate-400 block">
            Trầm nhất (Đáy)
          </span>
          <span className="text-sm font-black text-blue-600 tabular-nums">
            {pitchResult.minHz} Hz
          </span>
        </div>
      </div>
    </div>
  );
};
