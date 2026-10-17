import React from 'react';
import { ToneDefinition } from '../types/tones';
import { IntegratedFeedbackResult } from '../services/integratedFeedback';

interface CompanionBeLacProps {
  currentTone: ToneDefinition;
  currentWord: string;
  isListening: boolean;
  feedback: IntegratedFeedbackResult | null;
  improved: boolean;
  scoreDelta: number;
}

export const CompanionBeLac: React.FC<CompanionBeLacProps> = ({
  currentTone,
  currentWord,
  isListening,
  feedback,
  improved,
  scoreDelta,
}) => {
  let lacMessage = '';
  let lacMood: 'cheering' | 'listening' | 'encouraging' | 'idle' = 'idle';

  if (isListening) {
    lacMood = 'listening';
    lacMessage = `Bé Lạc đang lắng tai nghe em đọc từ "${currentWord}" nè... Cố lên nhé!`;
  } else if (feedback) {
    if (improved) {
      lacMood = 'cheering';
      lacMessage = `Bé Lạc reo hò: Em tiến bộ rõ rệt nè! Lượt này điểm tăng +${scoreDelta} điểm so với lượt trước trên thanh ${currentTone.shortName}, giỏi quá đi thôi! 🎉`;
    } else if (feedback.category === 'uncertain') {
      lacMood = 'encouraging';
      lacMessage = `Bé Lạc nhắn nhủ: Đừng lo nha em! Micro chưa bắt rõ âm thanh lúc nãy thôi, hoàn toàn không phải lỗi của em đâu nè! Hãy nghe mẫu chuẩn rồi đọc lại cùng Bé Lạc nhé! ❤️`;
    } else if (feedback.category === 'correct') {
      lacMood = 'cheering';
      lacMessage = `Bé Lạc vỗ tay: Tuyệt vời quá! Em phát âm thanh ${currentTone.shortName} chuẩn chỉnh lắm luôn! ⭐`;
    } else if (feedback.category === 'mismatch') {
      lacMood = 'encouraging';
      lacMessage = `Bé Lạc bảo: Tai nghe và đường giọng hơi lệch nhau một xíu, em bấm nút nghe lại mẫu rồi đọc lại cùng Bé Lạc nhé!`;
    } else {
      lacMood = 'encouraging';
      lacMessage = `Bé Lạc cổ vũ: Em uốn giọng theo hướng dẫn ở trên một chút là sẽ ra thanh ${currentTone.shortName} ngay, cố lên nào!`;
    }
  } else {
    lacMood = 'idle';
    lacMessage = `Chào em! Bé Lạc sẵn sàng đồng hành cùng em luyện thanh ${currentTone.name} ("${currentWord}") rồi nè. Hãy hít một hơi thật sâu rồi bấm micro nhé! ✨`;
  }

  return (
    <div className="w-full max-w-3xl mx-auto my-4 px-4">
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900 border-2 border-orange-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex items-center gap-3.5 sm:gap-4 transition-all">
        {/* Avatar Bé Lạc */}
        <div className="relative shrink-0 select-none">
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-black text-2xl sm:text-3xl shadow-sm border-2 border-white dark:border-slate-700 transition-transform ${
              lacMood === 'cheering'
                ? 'bg-gradient-to-tr from-amber-400 to-orange-500 text-white scale-105 animate-bounce'
                : lacMood === 'listening'
                ? 'bg-gradient-to-tr from-rose-400 to-amber-400 text-white animate-pulse'
                : 'bg-gradient-to-tr from-orange-400 to-amber-300 text-white'
            }`}
          >
            <span role="img" aria-label="Bé Lạc">
              {lacMood === 'cheering' ? '🦚' : lacMood === 'listening' ? '🎧' : '🐣'}
            </span>
          </div>

          <span className="absolute -bottom-1 -right-1 text-[10px] font-black uppercase px-1.5 py-0.2 rounded-md bg-orange-600 text-white shadow-2xs">
            Bé Lạc
          </span>
        </div>

        {/* Lời nói trong bong bóng thoại */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-black text-orange-950 dark:text-orange-400 uppercase tracking-wider">
              Bé Lạc đồng hành
            </span>
            {improved && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse">
                Đang tiến bộ!
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">
            {lacMessage}
          </p>
        </div>
      </div>
    </div>
  );
};
