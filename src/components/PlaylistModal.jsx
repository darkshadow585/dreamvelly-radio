import React from 'react';
import { X, Sparkles, Music, Disc3 } from 'lucide-react';
import { PLAYLISTS } from '../data/playlists';

export default function PlaylistModal({
  isOpen,
  onClose,
  activePlaylistId,
  onSelectPlaylist,
  currentSongId,
  onSelectSongById,
}) {
  if (!isOpen) return null;

  const currentPlaylist = PLAYLISTS.find((p) => p.id === activePlaylistId) || PLAYLISTS[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl max-h-[85dvh] bg-[#140f0c] border border-amber-400/25 rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col text-[#F4EFE8]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <img
              src="/ks_logo.png"
              alt="KS"
              className="w-10 h-10 rounded-full object-cover border border-amber-400/35 shadow-md"
            />
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-[#F4EFE8] flex items-center gap-1.5">
                KS Music Lounge <Sparkles size={15} className="text-amber-400" />
              </h2>
              <p className="text-xs text-[#F4EFE8]/55">Select a Curated Playlist or Track</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Playlist Channel Selector Tabs (2x2 Grid for 4 Channels) */}
        <div className="p-2.5 sm:p-3 bg-black/30 border-b border-white/10 grid grid-cols-2 gap-2">
          {PLAYLISTS.map((pl) => {
            const isActive = pl.id === activePlaylistId;
            return (
              <button
                key={pl.id}
                onClick={() => onSelectPlaylist(pl.id)}
                className={`flex items-center justify-between gap-1.5 py-2 px-3 rounded-xl font-medium text-xs sm:text-sm transition-all ${
                  isActive
                    ? 'bg-amber-400/20 border border-amber-400/40 text-amber-200 shadow-md ring-1 ring-amber-400/20'
                    : 'bg-white/[0.04] border border-white/5 text-white/65 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span>{pl.icon || '🎵'}</span>
                  <span className="truncate font-semibold tracking-wide">{pl.name}</span>
                </div>
                <span className="text-[10px] opacity-60 font-mono flex-shrink-0">
                  {pl.songs.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Songs List for Active Playlist */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-1.5 no-scrollbar">
          <div className="px-2 py-1 text-[11px] uppercase tracking-wider text-amber-300/60 font-semibold flex items-center justify-between">
            <span>{currentPlaylist.badge || currentPlaylist.name}</span>
            <span className="font-mono">{currentPlaylist.songs.length} Tracks</span>
          </div>

          {currentPlaylist.songs.map((song, index) => {
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
                    ? 'bg-amber-400/20 border border-amber-400/35 text-white shadow-sm'
                    : 'hover:bg-white/[0.06] text-white/80 border border-transparent'
                }`}
              >
                <div className="w-6 text-center text-xs font-mono text-white/40 group-hover:text-amber-300">
                  {isCurrent ? (
                    <span className="text-amber-400 font-bold">▶</span>
                  ) : (
                    index + 1
                  )}
                </div>

                <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-black/40 border border-white/10 relative">
                  <img
                    src={song.cover}
                    alt={song.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {isCurrent && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Disc3 size={16} className="text-amber-400 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      isCurrent ? 'text-amber-300 font-semibold' : 'text-[#F4EFE8]'
                    }`}
                  >
                    {song.title}
                  </p>
                  <p className="text-xs text-[#F4EFE8]/50 truncate">
                    {song.artist} {song.movie ? `• ${song.movie}` : ''}
                  </p>
                </div>

                <div className="text-xs text-[#F4EFE8]/40 font-mono pr-2 tabular-nums">
                  {song.duration}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-white/10 bg-black/40 text-center text-[11px] text-[#F4EFE8]/45">
          {currentPlaylist.description || 'Curated with passion by KS • High Fidelity Sound'}
        </div>
      </div>
    </div>
  );
}
