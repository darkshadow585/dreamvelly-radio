import React from 'react';
import { ChevronDown, Search, Moon, Feather, ListMusic } from 'lucide-react';
import { PLAYLISTS } from '../data/playlists';

export default function HeaderNav({
  activePlaylist,
  isPlaying,
  onSelectPlaylist,
  onOpenPlaylistModal,
  onOpenAbout,
  onOpenSearch,
  onToggleScreenOff,
  onOpenStoryStudio,
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 px-3.5 sm:px-7 md:px-10 pt-[max(0.85rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between pointer-events-none">
      {/* LEFT: Brand Identity & Live Studio Whisper */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onClick={onOpenAbout}
          className="group flex items-center gap-3 pr-3.5 pl-1.5 py-1.5 rounded-full glass-dock hover:border-[#D4A359]/45 transition-all duration-300 cursor-pointer"
          title="About Dreamvalley Sanctuary & Keyboard Shortcuts"
        >
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-white/20 ring-1 ring-[#D4A359]/30 flex-shrink-0">
            <img
              src="/ks_logo.png"
              alt="KS Emblem"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          <div className="flex flex-col items-start text-left">
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-semibold tracking-[0.16em] uppercase text-[#F4EFE8]">
                Dreamvalley
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isPlaying
                    ? 'bg-[#D4A359] shadow-[0_0_8px_rgba(212,163,89,0.9)] animate-pulse'
                    : 'bg-white/30'
                }`}
              />
            </div>
            <span className="hidden sm:inline text-[10px] text-[#9E968B] tracking-wider">
              Spatial Audio Sanctuary
            </span>
          </div>
        </button>
      </div>

      {/* CENTER: Level 5 Segmented Station Switcher (Desktop) */}
      {onSelectPlaylist && (
        <nav
          aria-label="Audio Stations"
          className="hidden lg:flex items-center gap-1 p-1.5 rounded-full glass-dock pointer-events-auto"
        >
          {PLAYLISTS.map((pl) => {
            const isActive = activePlaylist?.id === pl.id;
            const cleanName = pl.name.replace(/[^\w\s-]/g, '').trim();
            return (
              <button
                key={pl.id}
                onClick={() => onSelectPlaylist(pl.id)}
                className={`relative px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#F4EFE8] text-[#090807] font-semibold shadow-[0_4px_20px_rgba(244,239,232,0.2)]'
                    : 'text-[#A8A096] hover:text-[#F4EFE8] hover:bg-white/[0.05]'
                }`}
              >
                <span>{cleanName}</span>
                <span
                  className={`text-[10px] font-mono-tabular ${
                    isActive ? 'text-[#090807]/60' : 'text-white/30'
                  }`}
                >
                  {pl.songs.length}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {/* RIGHT: The Writer's Desk, Command Search, Zen Mode & Station Vault */}
      <div className="flex items-center gap-2 sm:gap-2.5 pointer-events-auto">
        {/* The Writer's Desk (Story Studio) */}
        <button
          onClick={onOpenStoryStudio}
          className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-[#241c13]/95 via-[#1c1610]/95 to-[#241c13]/95 backdrop-blur-2xl text-[#EAE5DF] hover:text-white border border-[#D4A359]/45 hover:border-[#D4A359] shadow-[0_10px_30px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(212,163,89,0.3)] transition-all duration-300 active:scale-95 group cursor-pointer"
          title="Open The Writer's Desk — Literary & Real Story Studio"
          aria-label="Open The Writer's Desk"
        >
          <Feather
            size={14}
            className="text-[#D4A359] group-hover:-rotate-12 transition-transform flex-shrink-0"
          />
          <span className="text-xs font-medium tracking-wide">
            Writer&apos;s Desk
          </span>
        </button>

        {/* Command Search Trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2 rounded-full glass-dock hover:border-white/30 text-[#EAE5DF]/85 hover:text-white transition-all duration-200 active:scale-95 group cursor-pointer"
          title="Search Catalogue or Paste YouTube Link (Shortcut: / or ⌘K)"
          aria-label="Search Songs and YouTube"
        >
          <Search
            size={14}
            className="text-[#D4A359] group-hover:scale-110 transition-transform"
          />
          <span className="hidden md:inline text-xs font-medium text-[#EAE5DF]/80">
            Search
          </span>
          <kbd className="hidden md:inline text-[10px] font-mono-tabular text-white/40 pl-1">
            ⌘K
          </kbd>
        </button>

        {/* OLED Zen Nightstand Trigger */}
        <button
          onClick={onToggleScreenOff}
          className="w-9 h-9 rounded-full flex items-center justify-center glass-dock text-[#EAE5DF]/75 hover:text-[#D4A359] hover:border-white/25 transition-all duration-200 active:scale-90 cursor-pointer"
          title="OLED Zen Nightstand Mode"
          aria-label="Zen Screen Off Mode"
        >
          <Moon size={14} />
        </button>

        {/* Station Vault & Track Queue Trigger */}
        <button
          onClick={onOpenPlaylistModal}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full glass-dock hover:border-white/30 text-[#F4EFE8] transition-all duration-200 active:scale-95 group cursor-pointer"
          title="Browse Stations & Full Tracklist"
        >
          <ListMusic size={14} className="text-[#D4A359] flex-shrink-0" />
          <span className="text-xs font-medium tracking-wide max-w-[90px] sm:max-w-[140px] truncate">
            {activePlaylist.name.replace(/[^\w\s-]/g, '').trim()}
          </span>
          <ChevronDown
            size={13}
            className="text-white/50 group-hover:text-white transition-transform group-hover:translate-y-0.5 flex-shrink-0"
          />
        </button>
      </div>
    </header>
  );
}
