import React from 'react';
import { X, BookOpen, Volume2, ArrowRight } from 'lucide-react';
import { VIETNAMESE_TONES } from '../data/tonesData';
import { speakVietnameseWord } from '../utils/audioPlayer';

interface ToneGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTone: (toneId: string) => void;
}

export const ToneGuideModal: React.FC<ToneGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectTone,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-amber-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Bảng 6 thanh điệu tiếng Việt
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Dành cho người nước ngoài, trẻ Việt kiều &amp; học sinh mới học chữ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-amber-100/60 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-800 text-xs sm:text-sm text-amber-950 dark:text-amber-200 font-medium leading-relaxed">
            💡 <span className="font-bold">Mẹo vàng:</span> Tiếng Việt là ngôn ngữ thanh điệu. Cùng một âm &ldquo;ma&rdquo;, chỉ cần đổi thanh điệu là sẽ thành từ hoàn toàn khác: <span className="font-bold">ma</span> (con ma), <span className="font-bold">má</span> (mẹ), <span className="font-bold">mà</span> (nhưng mà), <span className="font-bold">mả</span> (mồ mả), <span className="font-bold">mã</span> (con ngựa), <span className="font-bold">mạ</span> (cây lúa non).
          </div>

          <div className="space-y-3">
            {VIETNAMESE_TONES.map((t) => (
              <div
                key={t.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-500 hover:bg-orange-50/30 dark:hover:bg-slate-800/60 transition-all bg-white dark:bg-slate-850"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xs shrink-0 ${t.theme.arrowBg}`}
                  >
                    {t.arrowSymbol}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 dark:text-white text-base">
                        {t.name}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {t.diacriticName}
                      </span>
                      <span className="font-black text-xl text-orange-600 dark:text-orange-400">
                        {t.examples.ma.word}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
                      {t.instruction}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => speakVietnameseWord(t.examples.ma.word)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-amber-900 dark:hover:text-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors border border-slate-200/80 dark:border-slate-700"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span>Nghe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectTone(t.id);
                      onClose();
                    }}
                    className="px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <span>Luyện thanh này</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-bold text-sm cursor-pointer"
          >
            Đã hiểu, quay lại luyện tập
          </button>
        </div>
      </div>
    </div>
  );
};
