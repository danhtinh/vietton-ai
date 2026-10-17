import React, { useState } from 'react';
import {
  X,
  Settings2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  Sparkles,
  Link2,
} from 'lucide-react';
import {
  DEFAULT_TEACHABLE_MACHINE_URL,
  getCurrentModelUrl,
  setCustomModelUrl,
  resetToDefaultModelUrl,
} from '../services/teachableMachine';

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModelUrlChanged: (newUrl: string) => void;
}

export const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
  isOpen,
  onClose,
  onModelUrlChanged,
}) => {
  const [currentUrl, setCurrentUrl] = useState(getCurrentModelUrl());
  const [inputUrl, setInputUrl] = useState(getCurrentModelUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
    labels?: string[];
  } | null>(null);

  if (!isOpen) return null;

  const isDefault = currentUrl === DEFAULT_TEACHABLE_MACHINE_URL;

  const handleApply = async () => {
    setIsTesting(true);
    setStatusMessage(null);

    const res = await setCustomModelUrl(inputUrl);
    setIsTesting(false);

    if (res.success) {
      setCurrentUrl(res.url);
      setInputUrl(res.url);
      setStatusMessage({
        type: 'success',
        text: `Đã kết nối thành công với mô hình mới! Phát hiện ${res.labels.length} nhãn.`,
        labels: res.labels,
      });
      onModelUrlChanged(res.url);
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error || 'Không thể kết nối đến link này.',
      });
    }
  };

  const handleResetDefault = async () => {
    resetToDefaultModelUrl();
    setCurrentUrl(DEFAULT_TEACHABLE_MACHINE_URL);
    setInputUrl(DEFAULT_TEACHABLE_MACHINE_URL);
    setStatusMessage({
      type: 'success',
      text: 'Đã khôi phục về link mô hình mặc định của nhóm (nxdKU2Gh8).',
    });
    onModelUrlChanged(DEFAULT_TEACHABLE_MACHINE_URL);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-xs font-bold">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                Cài Đặt Mô Hình AI
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Tùy chỉnh link mô hình Teachable Machine
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

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Status badge */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600 dark:text-slate-300">Trạng thái:</span>
              {isDefault ? (
                <span className="font-black px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                  Mặc định (nxdKU2Gh8)
                </span>
              ) : (
                <span className="font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Link tùy chỉnh
                </span>
              )}
            </div>

            {!isDefault && (
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi phục mặc định</span>
              </button>
            )}
          </div>

          {/* Input field */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Đường link Teachable Machine (Model URL):
            </label>
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://teachablemachine.withgoogle.com/models/xyz/"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-200/40 text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none transition-all"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Link xuất bản từ Google Teachable Machine dạng{' '}
              <code className="text-orange-600 dark:text-orange-400 font-mono">
                https://teachablemachine.withgoogle.com/models/[mã_model]/
              </code>
            </p>
          </div>

          {/* Feedback message */}
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm font-medium flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p>{statusMessage.text}</p>
                {statusMessage.labels && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">
                      Các nhãn:
                    </span>
                    {statusMessage.labels.map((l) => (
                      <span
                        key={l}
                        className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Link to Teachable Machine */}
          <div className="bg-amber-50/70 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200/70 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300 leading-relaxed font-medium">
            💡 <span className="font-bold">Mẹo:</span> Bạn có thể tự huấn luyện mô hình âm thanh mới với 7 nhãn (Background Noise, Ma, Mà, Má, Mã, Mạ, Mả) tại{' '}
            <a
              href="https://teachablemachine.withgoogle.com/train/audio"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 dark:text-orange-400 font-bold underline inline-flex items-center gap-0.5"
            >
              Teachable Machine Audio <ExternalLink className="w-3 h-3" />
            </a>
            , nhấn <strong>Export Model</strong> &rarr; <strong>Upload my model</strong> rồi dán link vào đây.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefault}
            className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs sm:text-sm cursor-pointer"
          >
            Mặc định
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              disabled={isTesting}
              onClick={handleApply}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs sm:text-sm shadow-xs cursor-pointer active:scale-95 transition-all disabled:opacity-50"
            >
              {isTesting ? 'Đang kiểm tra...' : 'Kiểm tra & Lưu link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
