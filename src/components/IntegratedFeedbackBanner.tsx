import React from 'react';
import {
  IntegratedFeedbackResult,
  EVALUATION_CONFIG,
} from '../services/integratedFeedback';
import { Sparkles, CheckCircle2, HelpCircle, AlertTriangle, Volume2, Heart } from 'lucide-react';

interface IntegratedFeedbackBannerProps {
  feedback: IntegratedFeedbackResult | null;
  onPlaySampleAgain: () => void;
  targetWord: string;
}

export const IntegratedFeedbackBanner: React.FC<IntegratedFeedbackBannerProps> = ({
  feedback,
  onPlaySampleAgain,
  targetWord,
}) => {
  if (!feedback) return null;

  const { category, badgeTitle, comment } = feedback;

  let Icon = Sparkles;
  let containerBg = 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800';
  let iconBg = 'bg-amber-400 text-white';

  if (category === 'correct') {
    Icon = CheckCircle2;
    containerBg = 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-emerald-300 dark:border-emerald-800';
    iconBg = 'bg-emerald-500 text-white shadow-emerald-200 dark:shadow-none';
  } else if (category === 'uncertain') {
    Icon = HelpCircle;
    containerBg = 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800';
    iconBg = 'bg-amber-500 text-white';
  } else if (category === 'mismatch') {
    Icon = AlertTriangle;
    containerBg = 'bg-orange-50/90 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800';
    iconBg = 'bg-orange-500 text-white';
  } else if (category === 'wrong_confident') {
    Icon = Heart;
    containerBg = 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-orange-300 dark:border-orange-800';
    iconBg = 'bg-orange-500 text-white';
  }

  return (
    <div className={`rounded-3xl p-5 sm:p-6 border-2 transition-all shadow-xs ${containerBg}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm shrink-0 mt-0.5 sm:mt-0 ${iconBg}`}
          >
            <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs ${feedback.badgeBg} ${feedback.badgeColor} ${feedback.badgeBorder} dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700`}
              >
                {badgeTitle}
              </span>

              {feedback.isAiConfident && feedback.similarityScore !== undefined && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  Cao độ: {feedback.similarityScore}/100
                </span>
              )}
            </div>

            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
              {comment}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onPlaySampleAgain}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-stretch sm:self-auto justify-center active:scale-95 transition-all"
        >
          <Volume2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          <span>Nghe lại mẫu &ldquo;{targetWord}&rdquo;</span>
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium flex-wrap gap-2">
        <span>
          Quy tắc: AI chắc chắn khi &ge; {EVALUATION_CONFIG.MIN_CONFIDENCE_THRESHOLD}% &amp; cách thanh nhì &ge; {EVALUATION_CONFIG.MIN_MARGIN_OVER_SECOND}% · Ngưỡng cao độ khớp &ge; {EVALUATION_CONFIG.MIN_PITCH_SIMILARITY_SCORE} điểm
        </span>
        {feedback.topTonePercentage !== undefined && (
          <span className="font-bold text-slate-600 dark:text-slate-300">
            (Thanh cao nhất: {feedback.topTonePercentage}%
            {feedback.margin !== undefined ? `, chênh nhì: ${feedback.margin}%` : ''})
          </span>
        )}
      </div>
    </div>
  );
};
