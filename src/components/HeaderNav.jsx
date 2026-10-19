import React from 'react';
import { ChevronDown, Search, Moon, Feather } from 'lucide-react';

export default function HeaderNav({
  activePlaylist,
  onOpenPlaylistModal,
  onOpenAbout,
  onOpenSearch,
  onToggleScreenOff,
  onOpenStoryStudio,
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 px-4 sm:px-8 pt-[max(0.85rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between pointer-events-none">
      {/* LEFT: Minimal KS Logo Button */}
      <button
        onClick={onOpenAbout}
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden glass-dock border border-white/20 hover:border-[#D4A359]/60 transition-all duration-300 pointer-events-auto cursor-pointer flex-shrink-0"
        title="About & Keyboard Shortcuts"
      >
        <img
          src="/ks_logo.png"
          alt="Logo"
          className="w-full h-full object-cover"
        />
      </button>

      {/* RIGHT: Compact Studio Actions */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Stories (Writer's Desk) */}
        <button
          onClick={onOpenStoryStudio}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full glass-dock hover:border-[#D4A359]/60 text-[#F4EFE8] transition-all duration-200 active:scale-95 cursor-pointer"
          title="Open Story Studio"
        >
          <Feather size={13} className="text-[#D4A359]" />
          <span className="text-xs font-medium tracking-wide">Stories</span>
        </button>

        {/* Search */}
        <button
          onClick={onOpenSearch}
          className="w-9 h-9 rounded-full flex items-center justify-center glass-dock text-[#EAE5DF]/80 hover:text-white hover:border-white/30 transition-all duration-200 active:scale-95 cursor-pointer"
          title="Search Songs or Paste YouTube Link"
          aria-label="Search"
        >
          <Search size={14} />
        </button>

        {/* Zen Screen Off */}
        <button
          onClick={onToggleScreenOff}
          className="w-9 h-9 rounded-full flex items-center justify-center glass-dock text-[#EAE5DF]/80 hover:text-[#D4A359] hover:border-white/30 transition-all duration-200 active:scale-95 cursor-pointer"
          title="Screen Off Mode"
          aria-label="Screen Off Mode"
        >
          <Moon size={14} />
        </button>

        {/* Playlist Switcher */}
        <button
          onClick={onOpenPlaylistModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full glass-dock hover:border-white/30 text-[#F4EFE8] transition-all duration-200 active:scale-95 cursor-pointer"
          title="Switch Station & View Tracklist"
        >
          <span className="text-xs font-medium tracking-wide max-w-[110px] sm:max-w-[150px] truncate">
            {activePlaylist.name}
          </span>
          <ChevronDown size={13} className="text-white/50 flex-shrink-0" />
        </button>
      </div>
    </header>
  );
}
