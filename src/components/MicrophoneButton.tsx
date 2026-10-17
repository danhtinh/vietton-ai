import React from 'react';
import { Mic, Square, Radio, Loader2 } from 'lucide-react';
import { ToneDefinition } from '../types/tones';

interface MicrophoneButtonProps {
  currentTone: ToneDefinition;
  currentWord: string;
  isListening: boolean;
  isLoadingModel: boolean;
  onPressMic: () => void;
  remainingMs: number;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  currentTone,
  currentWord,
  isListening,
  isLoadingModel,
  onPressMic,
  remainingMs,
}) => {
  const secondsLeft = (remainingMs / 1000).toFixed(1);

  return (
    <div className="flex flex-col items-center justify-center my-6 sm:my-8 px-4">
      {/* Microphone status prompt */}
      <div className="mb-4 text-center">
        {isLoadingModel ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-sm sm:text-base animate-pulse">
            <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
            <span>Đang chuẩn bị mô hình Teachable Machine...</span>
          </div>
        ) : isListening ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100 border border-rose-300 text-rose-700 font-extrabold text-sm sm:text-base animate-pulse">
            <Radio className="w-4 h-4 text-rose-600 animate-spin" />
            <span>Đang nghe... Hãy đọc to: &ldquo;{currentWord}&rdquo;</span>
            <span className="bg-rose-600 text-white px-2.5 py-0.5 rounded-full text-xs font-black">
              {secondsLeft}s
            </span>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Thực hành phát âm cùng AI
            </span>
            <p className="text-sm sm:text-base text-slate-700 font-medium">
              Bạn đang luyện từ: <span className="font-black text-slate-900 text-lg sm:text-xl underline decoration-orange-400 decoration-3">&ldquo;{currentWord}&rdquo;</span> ({currentTone.name})
            </p>
          </div>
        )}
      </div>

      {/* Big Interactive Microphone Button */}
      <div className="relative flex items-center justify-center">
        {/* Animated aura rings when recording */}
        {isListening && (
          <>
            <span className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-rose-400/30 animate-ping duration-1000" />
            <span className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-rose-300/20 animate-pulse duration-700" />
          </>
        )}

        <button
          type="button"
          onClick={onPressMic}
          disabled={isListening || isLoadingModel}
          aria-label={isListening ? 'Đang nghe...' : 'Bấm để đọc'}
          className={`relative z-10 w-28 h-28 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center transition-all duration-200 cursor-pointer shadow-xl select-none active:scale-95 disabled:opacity-85 ${
            isListening
              ? 'bg-rose-600 text-white shadow-rose-300 ring-8 ring-rose-200 animate-mic-pulse'
              : 'bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white shadow-orange-300/80 hover:scale-105 hover:shadow-orange-400/90 ring-4 ring-orange-200'
          }`}
        >
          {isLoadingModel ? (
            <>
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin mb-1" />
              <span className="text-[11px] sm:text-xs font-black tracking-tight uppercase">
                Đang tải...
              </span>
            </>
          ) : isListening ? (
            <>
              <Radio className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse mb-1" />
              <span className="text-xs sm:text-sm font-black tracking-tight">
                ĐANG NGHE
              </span>
            </>
          ) : (
            <>
              <Mic className="w-11 h-11 sm:w-14 sm:h-14 stroke-[2.2] mb-1 drop-shadow-xs" />
              <span className="text-xs sm:text-sm font-black tracking-tight uppercase">
                Bấm để đọc
              </span>
            </>
          )}
        </button>
      </div>

      {/* Subtext instruction for learners */}
      <div className="mt-4 text-center max-w-sm">
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          {isListening
            ? 'Đang thu âm trong 1 giây... Hãy đọc to và rõ ràng vào micro'
            : 'Chạm nút micro to ở trên, cho phép micro và phát âm từ đã chọn'}
        </p>
      </div>

      {/* Visual audio wave bars when recording */}
      {isListening && (
        <div className="flex items-center gap-1.5 mt-4 h-6">
          {[40, 75, 100, 60, 90, 45, 80, 60, 95, 50, 85].map((height, i) => (
            <div
              key={i}
              className="w-1.5 bg-rose-500 rounded-full transition-all duration-150 animate-bounce"
              style={{
                height: `${height}%`,
                animationDelay: `${i * 70}ms`,
                animationDuration: '500ms',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
