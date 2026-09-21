import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function HeaderNav({ activePlaylist, onOpenPlaylistModal, onOpenAbout }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 px-5 md:px-8 py-4 flex items-center justify-between pointer-events-none">
      {/* Top Left: Authentic KS Luxury Monogram Emblem */}
      <div className="flex items-center gap-2.5 sm:gap-3 pointer-events-auto">
        <button
          onClick={onOpenAbout}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform overflow-hidden group border border-amber-400/30 ring-1 ring-white/10"
          title="About KS Music Lounge"
        >
          <img
            src="/ks_logo.png"
            alt="KS Emblem Logo"
            className="w-full h-full object-cover"
          />
        </button>
      </div>

      {/* Top Right: Current Playlist Pill Selector */}
      <div className="pointer-events-auto">
        <button
          onClick={onOpenPlaylistModal}
          className="flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-[#16120e]/80 hover:bg-[#16120e]/95 backdrop-blur-md border border-white/10 text-white shadow-sm transition-all duration-200 active:scale-95 group"
        >
          {/* Animated audio bar indicator */}
          <div className="flex items-end gap-[2px] h-3 w-3 sm:h-3.5 sm:w-3.5">
            <span className="w-[2px] sm:w-[2.5px] bg-emerald-400 rounded-full animate-pulse h-2.5 sm:h-3"></span>
            <span className="w-[2px] sm:w-[2.5px] bg-emerald-400 rounded-full animate-pulse [animation-delay:0.2s] h-1.5 sm:h-2"></span>
            <span className="w-[2px] sm:w-[2.5px] bg-emerald-400 rounded-full animate-pulse [animation-delay:0.4s] h-3 sm:h-3.5"></span>
          </div>

          <span className="text-xs sm:text-sm font-medium tracking-wide text-white/90">
            {activePlaylist.name}
          </span>

          <ChevronDown
            size={13}
            className="text-white/60 group-hover:text-white transition-transform group-hover:translate-y-0.5 ml-0.5"
          />
        </button>
      </div>
    </header>
  );
}
