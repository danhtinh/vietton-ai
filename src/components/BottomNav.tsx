import React from 'react';
import { Mic2, Map, BarChart3 } from 'lucide-react';

export type MainTabType = 'practice' | 'roadmap' | 'progress';

interface BottomNavProps {
  activeTab: MainTabType;
  onChangeTab: (tab: MainTabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  return (
    <nav
      aria-label="Thanh điều hướng chính"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-amber-200/80 dark:border-slate-800 shadow-lg py-1.5 px-3 select-none"
    >
      <div className="max-w-md mx-auto grid grid-cols-3 gap-1">
        {/* Tab 1: Luyện đọc */}
        <button
          type="button"
          onClick={() => onChangeTab('practice')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'practice'
              ? 'bg-orange-500 text-white shadow-xs font-black scale-102'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
          }`}
        >
          <Mic2 className={`w-5 h-5 mb-0.5 ${activeTab === 'practice' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-xs whitespace-nowrap">Luyện đọc</span>
        </button>

        {/* Tab 2: Lộ trình */}
        <button
          type="button"
          onClick={() => onChangeTab('roadmap')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'roadmap'
              ? 'bg-orange-500 text-white shadow-xs font-black scale-102'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
          }`}
        >
          <Map className={`w-5 h-5 mb-0.5 ${activeTab === 'roadmap' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-xs whitespace-nowrap">Lộ trình</span>
        </button>

        {/* Tab 3: Tiến bộ */}
        <button
          type="button"
          onClick={() => onChangeTab('progress')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'progress'
              ? 'bg-orange-500 text-white shadow-xs font-black scale-102'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
          }`}
        >
          <BarChart3 className={`w-5 h-5 mb-0.5 ${activeTab === 'progress' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-xs whitespace-nowrap">Tiến bộ</span>
        </button>
      </div>
    </nav>
  );
};
