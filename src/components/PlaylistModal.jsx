import React, { useState } from 'react';
import { X, Search, Play, Shuffle } from 'lucide-react';
import { PLAYLISTS } from '../data/playlists';

export default function PlaylistModal({
  isOpen,
  onClose,
  activePlaylistId,
  onSelectPlaylist,
  currentSongId,
  onSelectSongById,
  activePlaylistSongs,
  isPlaying,
  onToggleShuffle,
}) {
  const [filterText, setFilterText] = useState('');

  if (!isOpen) return null;

  const currentPlaylist =
    PLAYLISTS.find((p) => p.id === activePlaylistId) || PLAYLISTS[0];
  const playlistSongs = activePlaylistSongs || currentPlaylist.songs;
  const filteredSongs = playlistSongs.filter((s) => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    return (
      s.title?.toLowerCase().includes(q) ||
      s.artist?.toLowerCase().includes(q) ||
      s.movie?.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[86dvh] luxury-modal rounded-3xl overflow-hidden flex flex-col text-[#F4EFE8]"
      >
        {/* 1. ATMOSPHERIC STATION HERO HEADER */}
        <div className="relative h-36 sm:h-44 w-full overflow-hidden flex flex-col justify-between p-5 sm:p-6 border-b border-white/[0.08]">
          <img
            src={currentPlaylist.bg || '/barish_bg.jpg'}
            alt={currentPlaylist.name}
            className="absolute inset-0 w-full h-full object-cover opacity-45 scale-105 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090807] via-[#090807]/65 to-black/40" />

          {/* Top Bar */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-mono-tabular uppercase tracking-[0.2em] text-[#D4A359]">
              <span>{currentPlaylist.badge || 'Curated Station'}</span>
              <span aria-hidden="true">·</span>
              <span>{playlistSongs.length} Tracks</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white bg-black/40 hover:bg-white/10 border border-white/10 rounded-full transition cursor-pointer"
              aria-label="Close vault"
            >
              <X size={17} />
            </button>
          </div>

          {/* Bottom Hero Title & Description */}
          <div className="relative z-10 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-editorial font-semibold text-[#F4EFE8] tracking-tight">
                {currentPlaylist.name.replace(/[^\w\s-]/g, '').trim()}
              </h2>
              <p className="text-xs text-[#A8A096] mt-0.5 line-clamp-1">
                {currentPlaylist.description ||
                  'Curated atmospheric soundscape for deep listening.'}
              </p>
            </div>

            {onToggleShuffle && (
              <button
                onClick={() => {
                  onToggleShuffle();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#F4EFE8] hover:bg-white text-[#090807] text-xs font-semibold transition active:scale-95 cursor-pointer flex-shrink-0"
              >
                <Shuffle size={13} />
                <span>Shuffle</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. 4-STATION VISUAL SWITCHER STRIP */}
        <div className="p-3 sm:px-6 bg-[#0b0a09] border-b border-white/[0.07] grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PLAYLISTS.map((pl) => {
            const isActive = pl.id === activePlaylistId;
            const cleanName = pl.name.replace(/[^\w\s-]/g, '').trim();
            return (
              <button
                key={pl.id}
                onClick={() => onSelectPlaylist(pl.id)}
                className={`relative overflow-hidden rounded-xl p-2.5 text-left transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-[#1a1612] border-[#D4A359]/60 text-[#F4EFE8] shadow-md'
                    : 'bg-white/[0.02] border-white/[0.06] text-[#9E968B] hover:text-[#F4EFE8] hover:bg-white/[0.05]'
                }`}
              >
                <div className="text-xs font-semibold truncate">{cleanName}</div>
                <div className="text-[10px] font-mono-tabular text-[#8C857B] mt-0.5">
                  {pl.songs.length} tracks
                </div>
              </button>
            );
          })}
        </div>

        {/* 3. INSTANT TRACK FILTER */}
        <div className="px-4 sm:px-6 pt-3 pb-2 bg-[#0b0a09]">
          <div className="relative flex items-center">
            <Search
              size={14}
              className="absolute left-3.5 text-[#9E968B] pointer-events-none"
            />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={`Filter tracks in ${currentPlaylist.name
                .replace(/[^\w\s-]/g, '')
                .trim()}...`}
              className="w-full pl-9 pr-8 py-2 bg-[#141210] border border-white/[0.08] focus:border-[#D4A359]/50 rounded-xl text-xs text-[#F4EFE8] placeholder-[#8C857B] outline-none transition"
            />
            {filterText && (
              <button
                onClick={() => setFilterText('')}
                className="absolute right-3 text-[#8C857B] hover:text-white cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* 4. EDITORIAL TRACKLIST */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2 space-y-1 no-scrollbar">
          {filteredSongs.map((song, index) => {
            const isCurrent = song.id === currentSongId;
            return (
              <div
                key={`${song.id}-${index}`}
                onClick={() => {
                  onSelectSongById(song.id);
                  onClose();
                }}
                className={`flex items-center gap-3.5 p-2.5 rounded-xl cursor-pointer transition-all group ${
                  isCurrent
                    ? 'bg-[#1a1612] border border-[#D4A359]/40 text-[#F4EFE8]'
                    : 'hover:bg-white/[0.04] text-[#EAE5DF]/85 border border-transparent'
                }`}
              >
                {/* Index or Live Equalizer */}
                <div className="w-6 flex items-center justify-center text-xs font-mono-tabular text-[#8C857B]">
                  {isCurrent && isPlaying ? (
                    <div className="flex items-end gap-[2px] h-3">
                      {[0.4, 1, 0.6].map((h, i) => (
                        <span
                          key={i}
                          className="w-[2px] bg-[#D4A359] rounded-full animate-studio-wave"
                          style={{
                            height: `${Math.round(h * 100)}%`,
                            animationDelay: `${i * 0.14}s`,
                          }}
                        />
                      ))}
                    </div>
                  ) : isCurrent ? (
                    <Play size={12} className="text-[#D4A359]" fill="currentColor" />
                  ) : (
                    <span>{index + 1 < 10 ? `0${index + 1}` : index + 1}</span>
                  )}
                </div>

                {/* Sleeve Thumbnail */}
                <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-black/50 border border-white/10">
                  <img
                    src={song.cover}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                {/* Title & Unboxed Metadata */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm truncate ${
                      isCurrent
                        ? 'text-[#D4A359] font-semibold'
                        : 'text-[#F4EFE8] font-medium'
                    }`}
                  >
                    {song.title}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-[#9E968B] truncate mt-0.5">
                    <span className="truncate">{song.artist}</span>
                    {song.movie && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="truncate text-[#8C857B]">{song.movie}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Duration */}
                <div className="text-xs text-[#8C857B] font-mono-tabular pr-1">
                  {song.duration}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
