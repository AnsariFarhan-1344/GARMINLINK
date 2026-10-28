import React from 'react';
import { Mic, MessageSquareText, Sparkles } from 'lucide-react';
import { useGaadiSahayak } from '../../context/GaadiSahayakContext';
import { useLanguage } from '../../context/LanguageContext';

export const FloatingMicButton: React.FC = () => {
  const { openAssistant, isOpen } = useGaadiSahayak();
  const { language, t } = useLanguage();

  if (isOpen) {
    return null; // Hide floating trigger while assistant modal sheet is active
  }

  const tooltipLabel = t('assistant_tooltip');

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex items-center gap-2 group">
      {/* Quick Text Input Fallback Button */}
      <button
        onClick={() => openAssistant('')}
        aria-label={t('assistant_type_to_search')}
        title={t('assistant_type_to_search')}
        className="hidden sm:flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white text-[#263238] shadow-md hover:bg-[#F5F2E9] border border-[#DCD8C8] transition-all hover:scale-105 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#556B2F]"
      >
        <MessageSquareText className="w-5 h-5 text-[#556B2F]" />
      </button>

      {/* Main 56px Floating Mic Button */}
      <button
        onClick={() => openAssistant()}
        aria-label={tooltipLabel}
        className="relative flex items-center justify-center w-14 h-14 min-w-[56px] min-h-[56px] rounded-full bg-[#556B2F] text-white shadow-xl hover:bg-[#435525] active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#556B2F]/30"
      >
        {/* Radar Ring Ripple */}
        <span className="absolute -inset-1 rounded-full bg-[#556B2F] opacity-30 animate-ping pointer-events-none" />

        <div className="relative flex items-center justify-center">
          <Mic className="w-6 h-6 text-white drop-shadow-xs" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <Sparkles className="w-3.5 h-3.5 text-[#E65100] animate-pulse" />
          </span>
        </div>

        {/* Hover Pill Tooltip */}
        <span className="absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-[#263238] text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
          {tooltipLabel}
        </span>
      </button>
    </div>
  );
};
