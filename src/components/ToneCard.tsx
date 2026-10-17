import React from 'react';
import { Volume2, CheckCircle2, GraduationCap } from 'lucide-react';
import { ToneDefinition } from '../types/tones';

interface ToneCardProps {
  tone: ToneDefinition;
  word: string;
  meaning: string;
  isSelected: boolean;
  hasTeacherSample?: boolean;
  onSelect: () => void;
  onPlayAudio: (e: React.MouseEvent) => void;
  isPlayingAudio: boolean;
}

export const ToneCard: React.FC<ToneCardProps> = ({
  tone,
  word,
  meaning,
  isSelected,
  hasTeacherSample = false,
  onSelect,
  onPlayAudio,
  isPlayingAudio,
}) => {
  const { theme } = tone;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`group relative rounded-3xl p-5 sm:p-6 transition-all duration-200 cursor-pointer text-left flex flex-col justify-between border-2 select-none active:scale-[0.98] ${
        isSelected
          ? `${theme.bgCardActive} dark:bg-slate-800/90 ${theme.borderActive} dark:border-orange-500 shadow-lg ${theme.glowColor}`
          : `${theme.bgCard} dark:bg-slate-900/80 ${theme.borderDefault} dark:border-slate-800 hover:shadow-md hover:border-slate-400/50 dark:hover:border-slate-700`
      }`}
    >
      {/* Selection indicator badge */}
      {isSelected && (
        <div className="absolute -top-3 -right-2 z-10">
          <span className="flex items-center gap-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-orange-500 rounded-full px-2.5 py-0.5 text-xs font-black shadow-md">
            <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 fill-orange-100 dark:fill-orange-950" />
            <span>Đang chọn</span>
          </span>
        </div>
      )}

      {/* Top row: Tone Name & Arrow Indicator */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-xs sm:text-sm font-extrabold px-3 py-1 rounded-xl uppercase tracking-wider ${theme.badgeBg} dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700`}
          >
            {tone.shortName}
          </span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            ({tone.diacriticName})
          </span>

          {hasTeacherSample && (
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
              <GraduationCap className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
              <span>Giọng cô</span>
            </span>
          )}
        </div>

        {/* Mũi tên chỉ giọng lên hay xuống */}
        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl shadow-xs transition-transform group-hover:scale-110 ${theme.arrowBg}`}
          title={tone.arrowDirectionLabel}
        >
          <span>{tone.arrowSymbol}</span>
        </div>
      </div>

      {/* Main big word & pronunciation button */}
      <div className="my-2 flex items-baseline justify-between gap-2">
        <div>
          <div className="text-5xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white">
            {word}
          </div>
          <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
            {meaning}
          </div>
        </div>

        {/* Nút nghe đọc mẫu (chỉ để người học nghe) */}
        <button
          type="button"
          onClick={onPlayAudio}
          aria-label={`Nghe phát âm từ ${word}`}
          className={`p-3 sm:p-3.5 rounded-2xl flex items-center gap-1.5 font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            isPlayingAudio
              ? 'bg-amber-400 text-slate-900 scale-105 shadow-md animate-pulse'
              : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 shadow-xs'
          }`}
          title={hasTeacherSample ? 'Bấm để nghe giọng mẫu của giáo viên' : 'Bấm để nghe đọc mẫu'}
        >
          <Volume2 className={`w-5 h-5 ${isPlayingAudio ? 'text-slate-950 animate-bounce' : hasTeacherSample ? 'text-emerald-700 dark:text-emerald-400' : theme.primary}`} />
          <span className="font-extrabold hidden xs:inline">
            {hasTeacherSample ? 'Nghe cô' : 'Nghe mẫu'}
          </span>
        </button>
      </div>

      {/* Mũi tên mô tả giọng */}
      <div className="mt-2 mb-3 flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-800/80 rounded-xl px-3 py-1.5 border border-slate-200/50 dark:border-slate-700">
        <span className="text-base leading-none">{tone.arrowSymbol}</span>
        <span className="truncate">{tone.arrowDirectionLabel}</span>
      </div>

      {/* Câu hướng dẫn cách đọc */}
      <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 mt-auto">
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
          <span className="font-bold text-slate-900 dark:text-white">Cách đọc: </span>
          {tone.instruction}
        </p>
      </div>
    </div>
  );
};
