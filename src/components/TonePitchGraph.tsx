import React from 'react';
import { ToneDefinition } from '../types/tones';
import { TeacherToneSample } from '../services/teacherStorage';
import { CheckCircle2, Sparkles, GraduationCap } from 'lucide-react';

interface TonePitchGraphProps {
  tone: ToneDefinition;
  word: string;
  teacherSample?: TeacherToneSample;
}

export const TonePitchGraph: React.FC<TonePitchGraphProps> = ({
  tone,
  word,
  teacherSample,
}) => {
  const width = 280;
  const height = 120;
  const paddingX = 26;
  const paddingY = 18;

  const hasTeacher = Boolean(teacherSample && teacherSample.pitchPoints && teacherSample.pitchPoints.length > 0);

  // Điểm mẫu mô phỏng chuẩn 5 bậc
  const points = tone.pitchPoints;
  const stepX = (width - paddingX * 2) / (points.length - 1);

  const coords = points.map((p, idx) => {
    const x = paddingX + idx * stepX;
    const y = paddingY + (5 - p) * ((height - paddingY * 2) / 4);
    return { x, y };
  });

  const pathD = coords.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = coords[idx - 1];
    const cpX = (prev.x + curr.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }, '');

  // Điểm nếu có giọng giáo viên thực tế
  let teacherPathD = '';
  if (hasTeacher && teacherSample) {
    const tPoints = teacherSample.pitchPoints;
    const tStepX = (width - paddingX * 2) / Math.max(1, tPoints.length - 1);
    const tCoords = tPoints.map((p, idx) => {
      const x = paddingX + idx * tStepX;
      const y = paddingY + (5 - p.pitchLevel) * ((height - paddingY * 2) / 4);
      return { x, y };
    });

    teacherPathD = tCoords.reduce((acc, curr, idx) => {
      if (idx === 0) return `M ${curr.x} ${curr.y}`;
      const prev = tCoords[idx - 1];
      const cpX = (prev.x + curr.x) / 2;
      return `${acc} C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }, '');
  }

  return (
    <div className="w-full bg-white/90 dark:bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Đồ thị cao độ mẫu chuẩn (F0)
          </span>

          {hasTeacher ? (
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Mẫu giọng giáo viên ({teacherSample?.startHz}Hz &rarr; {teacherSample?.endHz}Hz)</span>
            </span>
          ) : (
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Mẫu mô phỏng (chuẩn ngữ âm 5 bậc)</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 self-start sm:self-auto">
          <span>{tone.arrowSymbol}</span>
          <span>{tone.arrowDirectionLabel}</span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-32 sm:h-36 overflow-visible select-none"
        >
          <defs>
            <linearGradient id={`grad-sim-${tone.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={tone.theme.strokeHex} stopOpacity="0.7" />
              <stop offset="100%" stopColor={tone.theme.hexAccent} stopOpacity="1" />
            </linearGradient>
            <linearGradient id={`area-sim-${tone.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={tone.theme.hexAccent} stopOpacity="0.18" />
              <stop offset="100%" stopColor={tone.theme.hexAccent} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines for 5 pitch levels */}
          {[5, 4, 3, 2, 1].map((level) => {
            const y = paddingY + (5 - level) * ((height - paddingY * 2) / 4);
            const isMid = level === 3;
            return (
              <g key={level} className="text-slate-300 dark:text-slate-700">
                <line
                  x1={paddingX - 10}
                  y1={y}
                  x2={width - paddingX + 10}
                  y2={y}
                  stroke={isMid ? '#94a3b8' : '#e2e8f0'}
                  strokeOpacity={0.6}
                  strokeWidth={isMid ? 1.5 : 1}
                  strokeDasharray={isMid ? 'none' : '3 3'}
                />
                <text x={8} y={y + 3} fontSize="8" className="fill-slate-400 dark:fill-slate-500 font-bold">
                  {level === 5 ? 'Cao (5)' : level === 3 ? 'Vừa (3)' : level === 1 ? 'Trầm (1)' : level}
                </text>
              </g>
            );
          })}

          {/* Đường mẫu mô phỏng chuẩn */}
          <path
            d={`${pathD} L ${coords[coords.length - 1].x} ${height - paddingY} L ${coords[0].x} ${height - paddingY} Z`}
            fill={`url(#area-sim-${tone.id})`}
          />

          <path
            d={pathD}
            fill="none"
            stroke={hasTeacher ? '#64748b' : `url(#grad-sim-${tone.id})`}
            strokeWidth={hasTeacher ? 2.5 : 5}
            strokeDasharray={hasTeacher ? '4 4' : 'none'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Nếu có giọng giáo viên thì vẽ đường nổi bật đè lên */}
          {hasTeacher && teacherPathD && (
            <path
              d={teacherPathD}
              fill="none"
              stroke="#10b981"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points on curve */}
          {coords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={hasTeacher ? 2.5 : (i === 0 || i === coords.length - 1 ? 5 : 3.5)}
              fill="#ffffff"
              stroke={hasTeacher ? '#64748b' : tone.theme.strokeHex}
              strokeWidth={hasTeacher ? 1.5 : 3}
            />
          ))}

          {/* Word label at end */}
          <text
            x={coords[coords.length - 1].x + 6}
            y={coords[coords.length - 1].y + 4}
            fontSize="10"
            fontWeight="black"
            fill={hasTeacher ? '#10b981' : tone.theme.strokeHex}
          >
            {word}
          </text>
        </svg>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
        <span className="italic">{tone.pitchContourDescription}</span>
        {hasTeacher ? (
          <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đang lấy giọng giáo viên làm chuẩn đối chiếu</span>
          </span>
        ) : (
          <span className="text-amber-800 dark:text-amber-400 font-medium">
            (Chưa có giọng giáo viên &ndash; đang dùng mẫu mô phỏng)
          </span>
        )}
      </div>
    </div>
  );
};
