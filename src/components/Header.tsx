import React from 'react';
import { Volume2, HelpCircle, Sparkles, GraduationCap, Moon, Sun, Settings2, Link2 } from 'lucide-react';
import { ThemeMode } from '../utils/theme';

interface HeaderProps {
  onOpenHelp: () => void;
  onOpenTeacherStudio: () => void;
  onOpenModelSettings: () => void;
  teacherSampleCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  isCustomModel: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHelp,
  onOpenTeacherStudio,
  onOpenModelSettings,
  teacherSampleCount,
  soundEnabled,
  onToggleSound,
  theme,
  onToggleTheme,
  isCustomModel,
}) => {
  return (
    <header className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-amber-100 dark:border-slate-800 sticky top-0 z-40 transition-all">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Zone 1: Single Brand element */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white font-extrabold shadow-md shadow-orange-200 dark:shadow-none">
            <span className="text-xl sm:text-2xl tracking-tighter">á</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
              VietTone <span className="text-orange-600 dark:text-orange-500">AI</span>
            </h1>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 tracking-wide mt-1 hidden xs:inline-block">
              Luyện 6 thanh điệu tiếng Việt
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation / Guides */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <span className="text-slate-900 dark:text-white font-bold border-b-2 border-orange-500 pb-1">
            Luyện tập 6 thanh
          </span>
          <button
            onClick={onOpenTeacherStudio}
            className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300"
          >
            <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Thu âm mẫu (Giáo viên)</span>
            {teacherSampleCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black border border-emerald-300 dark:border-emerald-800">
                {teacherSampleCount}/6
              </span>
            )}
          </button>
          <button
            onClick={onOpenHelp}
            className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300"
          >
            <HelpCircle className="w-4 h-4 text-orange-500 dark:text-orange-400" />
            <span>Mẹo phát âm</span>
          </button>
        </nav>

        {/* Zone 3: Interactive controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* NÚT THAY ĐỔI LINK TEACHABLE MACHINE */}
          <button
            type="button"
            onClick={onOpenModelSettings}
            className={`p-2 sm:px-3 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isCustomModel
                ? 'bg-orange-100 dark:bg-orange-950/70 text-orange-900 dark:text-orange-300 border border-orange-300 dark:border-orange-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
            title="Cài đặt link mô hình Teachable Machine"
            aria-label="Cài đặt mô hình AI"
          >
            <Link2 className={`w-4 h-4 ${isCustomModel ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className="hidden sm:inline">Model AI</span>
            {isCustomModel && (
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" title="Đang dùng link tùy chỉnh" />
            )}
          </button>

          {/* NÚT CHUYỂN ĐỔI DARK / LIGHT MODE */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title={theme === 'dark' ? 'Chuyển sang chế độ Sáng (Light mode)' : 'Chuyển sang chế độ Tối (Dark mode)'}
            aria-label="Chuyển đổi giao diện sáng tối"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Nút vào phòng thu âm mẫu cho giáo viên */}
          <button
            type="button"
            onClick={onOpenTeacherStudio}
            className="px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Ghi âm hoặc tải file mẫu giọng giáo viên"
          >
            <GraduationCap className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span className="hidden xs:inline">Góc cô</span>
            {teacherSampleCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-black">
                {teacherSampleCount}
              </span>
            )}
          </button>

          {/* Nút bật tắt âm thanh */}
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Tắt âm thanh hướng dẫn' : 'Bật âm thanh hướng dẫn'}
            className={`p-2 sm:px-2.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900 border border-amber-300/60 dark:border-amber-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
            title="Bật/Tắt âm thanh mẫu"
          >
            <Volume2 className={`w-4 h-4 ${soundEnabled ? 'text-amber-700 dark:text-amber-400' : 'text-slate-400'}`} />
          </button>

          <button
            type="button"
            onClick={onOpenHelp}
            className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs shadow-orange-300 dark:shadow-none transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden md:inline">Hướng dẫn</span>
          </button>
        </div>
      </div>
    </header>
  );
};
