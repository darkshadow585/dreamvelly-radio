import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  Share2,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Loader2,
  Sliders,
  ListMusic,
  Heart,
} from 'lucide-react';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function BottomPlayerDock({
  currentSong,
  nextSong,
  isPlaying,
  isBuffering,
  currentTime,
  duration,
  volume,
  isMuted,
  isShuffle,
  repeatMode,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onChangeVolume,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onOpenShare,
  onOpenPlaylistModal,
  onOpenSoundscape,
  hasActiveSoundscape = false,
  sleepRemainingSecs = 0,
  isLiked = false,
  onToggleLike,
  isFullscreen,
  onToggleFullscreen,
}) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [hoverPercent, setHoverPercent] = useState(null);

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const handleProgressBarClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    if (duration > 0) {
      onSeek(percentage * duration);
    }
  };

  const handleProgressBarHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, hoverX / rect.width));
    setHoverPercent(percentage);
  };

  return (
    <>
      <div className="fixed bottom-3 sm:bottom-5 inset-x-0 z-40 flex justify-center pointer-events-none px-2.5 sm:px-6 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {/* ========================================================= */}
        {/* 1. MOBILE MASTER CONSOLE (< 640px)                        */}
        {/* ========================================================= */}
        <div className="flex sm:hidden relative pointer-events-auto w-full max-w-[500px] flex-col rounded-[24px] glass-dock text-[#F4EFE8] overflow-hidden p-3 pt-2.5">
          {/* Scrubbable Progress Bar */}
          <div className="w-full flex flex-col gap-1 mb-1.5 select-none">
            <div
              onClick={handleProgressBarClick}
              className="relative w-full h-[12px] flex items-center cursor-pointer group select-none"
              title="Seek"
            >
              <div className="w-full h-[3px] bg-white/15 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-[#D4A359] via-amber-300 to-[#F4EFE8] rounded-full transition-all duration-100"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#F4EFE8] shadow-[0_0_8px_rgba(212,163,89,0.9)] pointer-events-none transition-all duration-100"
                style={{ left: `calc(${progressPercent}% - 5px)` }}
              />
            </div>

            <div className="flex items-center justify-between text-[9.5px] text-[#9E968B] font-mono-tabular px-0.5 -mt-1 leading-none">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls & Track Info Row */}
          <div className="flex items-center justify-between gap-2.5 relative z-10">
            <div
              onClick={onOpenPlaylistModal}
              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
            >
              <div
                className={`w-10 h-10 rounded-[10px] overflow-hidden flex-shrink-0 bg-black/50 border transition-all duration-300 ${
                  isPlaying ? 'border-[#D4A359]/70' : 'border-white/15'
                }`}
              >
                <img
                  src={currentSong?.cover}
                  alt={currentSong?.title}
                  className="w-full h-full object-cover select-none pointer-events-none"
                />
              </div>

              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <h4 className="text-[12.5px] font-semibold text-[#F4EFE8] truncate leading-tight">
                  {currentSong?.title}
                </h4>
                <p className="text-[10.5px] text-[#9E968B] truncate leading-tight mt-0.5">
                  {currentSong?.artist}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-0.5 flex-shrink-0">
              {onToggleLike && currentSong && (
                <button
                  onClick={() => onToggleLike(currentSong.id)}
                  className={`p-1.5 rounded-full transition cursor-pointer ${
                    isLiked ? 'text-[#D4A359]' : 'text-white/45 hover:text-white'
                  }`}
                  title="Like Track"
                >
                  <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />
                </button>
              )}

              <button
                onClick={onPrev}
                className="p-1.5 text-white/70 hover:text-white active:scale-90 transition-all rounded-full cursor-pointer"
                title="Previous"
              >
                <SkipBack size={17} />
              </button>

              <button
                onClick={onTogglePlay}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 mx-0.5 cursor-pointer ${
                  isPlaying
                    ? 'bg-[#D4A359] text-[#090807] shadow-[0_0_20px_rgba(212,163,89,0.45)]'
                    : 'bg-[#F4EFE8] text-[#090807] shadow-md'
                }`}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isBuffering ? (
                  <Loader2 size={18} className="animate-spin text-[#090807]" />
                ) : isPlaying ? (
                  <Pause size={17} fill="currentColor" />
                ) : (
                  <Play size={17} fill="currentColor" className="ml-0.5" />
                )}
              </button>

              <button
                onClick={onNext}
                className="p-1.5 text-white/70 hover:text-white active:scale-90 transition-all rounded-full cursor-pointer"
                title="Next"
              >
                <SkipForward size={17} />
              </button>

              {onOpenSoundscape && (
                <button
                  onClick={onOpenSoundscape}
                  className={`p-1.5 rounded-full transition-all active:scale-90 cursor-pointer ${
                    hasActiveSoundscape || sleepRemainingSecs > 0
                      ? 'text-[#D4A359] bg-[#D4A359]/15'
                      : 'text-white/50 hover:text-white'
                  }`}
                  title="Soundscape Mixer & Sleep Timer"
                >
                  <Sliders size={15} />
                </button>
              )}

              <button
                onClick={onOpenShare}
                className="p-1.5 text-white/50 hover:text-white active:scale-90 transition-all rounded-full cursor-pointer"
                title="Share Postcard"
              >
                <Share2 size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. DESKTOP MASTER ACOUSTIC CONSOLE (≥ 640px)              */}
        {/* ========================================================= */}
        <div className="hidden sm:flex relative pointer-events-auto w-full max-w-[900px] flex-col rounded-[26px] glass-dock text-[#F4EFE8] px-6 py-3.5">
          {/* Top Full-Width Precision Interactive Progress Bar */}
          <div className="w-full flex items-center gap-3 mb-2.5 select-none">
            <span className="text-[10.5px] font-mono-tabular text-[#9E968B] w-9 text-right">
              {formatTime(currentTime)}
            </span>

            <div
              onClick={handleProgressBarClick}
              onMouseMove={handleProgressBarHover}
              onMouseLeave={() => setHoverPercent(null)}
              className="relative flex-1 h-3 flex items-center cursor-pointer group"
            >
              {/* Hover Timestamp Tooltip */}
              {hoverPercent !== null && duration > 0 && (
                <div
                  className="absolute -top-6 -translate-x-1/2 px-2 py-0.5 rounded bg-[#141210] border border-white/15 text-[10px] font-mono-tabular text-[#EAE5DF] pointer-events-none shadow-md"
                  style={{ left: `${hoverPercent * 100}%` }}
                >
                  {formatTime(hoverPercent * duration)}
                </div>
              )}

              <div className="w-full h-[3px] group-hover:h-[5px] bg-white/12 rounded-full overflow-hidden relative transition-all duration-200">
                <div
                  className="h-full bg-gradient-to-r from-[#D4A359] via-[#E8BF7A] to-[#F4EFE8] rounded-full transition-all duration-100"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <span
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#F4EFE8] shadow-[0_0_10px_rgba(212,163,89,0.9)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `calc(${progressPercent}% - 6px)` }}
              />
            </div>

            <span className="text-[10.5px] font-mono-tabular text-[#9E968B] w-9">
              {formatTime(duration)}
            </span>
          </div>

          {/* Main Console Row */}
          <div className="flex items-center justify-between gap-4">
            {/* LEFT: Active Track Sleeve, Metadata & Heart Toggle */}
            <div className="flex items-center gap-3 min-w-0 w-[265px] md:w-[300px]">
              <div
                onClick={onOpenPlaylistModal}
                className={`relative w-12 h-12 rounded-[12px] overflow-hidden flex-shrink-0 bg-black/50 border transition-all duration-300 cursor-pointer ${
                  isPlaying
                    ? 'border-[#D4A359]/70 shadow-[0_0_15px_rgba(212,163,89,0.25)]'
                    : 'border-white/15'
                }`}
                title="Open Station Queue"
              >
                <img
                  src={currentSong?.cover}
                  alt={currentSong?.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div
                onClick={onOpenPlaylistModal}
                className="min-w-0 flex-1 cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-[#F4EFE8] truncate group-hover:text-[#D4A359] transition-colors">
                    {currentSong?.title}
                  </h4>
                  {isPlaying && (
                    <div className="flex items-end gap-[2px] h-3 flex-shrink-0">
                      {[0.4, 0.95, 0.55, 1, 0.6].map((h, i) => (
                        <span
                          key={i}
                          className="w-[2px] bg-[#D4A359] rounded-full animate-studio-wave"
                          style={{
                            height: `${Math.round(h * 100)}%`,
                            animationDelay: `${i * 0.12}s`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-[#9E968B] truncate mt-0.5">
                  {currentSong?.artist}
                </p>
              </div>

              {onToggleLike && currentSong && (
                <button
                  onClick={() => onToggleLike(currentSong.id)}
                  className={`p-1.5 rounded-full transition cursor-pointer flex-shrink-0 ${
                    isLiked
                      ? 'text-[#D4A359]'
                      : 'text-[#8C857B] hover:text-[#F4EFE8]'
                  }`}
                  title={isLiked ? 'Remove from Liked' : 'Save to Liked Tracks'}
                >
                  <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />
                </button>
              )}
            </div>

            {/* CENTER: Precision Transport Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={onToggleShuffle}
                className={`p-2 rounded-full transition-all cursor-pointer ${
                  isShuffle
                    ? 'text-[#D4A359] bg-[#D4A359]/15'
                    : 'text-[#9E968B] hover:text-[#F4EFE8] hover:bg-white/[0.06]'
                }`}
                title="Shuffle"
              >
                <Shuffle size={15} />
              </button>

              <button
                onClick={onPrev}
                className="p-2 text-[#EAE5DF]/80 hover:text-white hover:bg-white/[0.08] rounded-full transition-all active:scale-90 cursor-pointer"
                title="Previous Track (←)"
              >
                <SkipBack size={19} />
              </button>

              <button
                onClick={onTogglePlay}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${
                  isPlaying
                    ? 'bg-[#D4A359] text-[#090807] shadow-[0_0_26px_rgba(212,163,89,0.5)]'
                    : 'bg-[#F4EFE8] text-[#090807] hover:bg-white shadow-lg'
                }`}
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isBuffering ? (
                  <Loader2 size={20} className="animate-spin text-[#090807]" />
                ) : isPlaying ? (
                  <Pause size={19} fill="currentColor" />
                ) : (
                  <Play size={19} fill="currentColor" className="ml-0.5" />
                )}
              </button>

              <button
                onClick={onNext}
                className="p-2 text-[#EAE5DF]/80 hover:text-white hover:bg-white/[0.08] rounded-full transition-all active:scale-90 cursor-pointer"
                title="Next Track (→)"
              >
                <SkipForward size={19} />
              </button>

              <button
                onClick={onToggleRepeat}
                className={`p-2 rounded-full transition-all cursor-pointer ${
                  repeatMode !== 'off'
                    ? 'text-[#D4A359] bg-[#D4A359]/15'
                    : 'text-[#9E968B] hover:text-[#F4EFE8] hover:bg-white/[0.06]'
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? <Repeat1 size={15} /> : <Repeat size={15} />}
              </button>
            </div>

            {/* RIGHT: 4-Channel Soundscape Studio, Queue, Share & Volume */}
            <div className="flex items-center justify-end gap-1.5 w-[265px] md:w-[300px]">
              {/* 4-Channel Soundscape & Sleep Studio Trigger */}
              {onOpenSoundscape && (
                <button
                  onClick={onOpenSoundscape}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer mr-1 ${
                    hasActiveSoundscape || sleepRemainingSecs > 0
                      ? 'text-[#EAE5DF] bg-[#D4A359]/20 border border-[#D4A359]/50 shadow-[0_0_15px_rgba(212,163,89,0.2)]'
                      : 'text-[#9E968B] hover:text-[#F4EFE8] hover:bg-white/[0.06] border border-transparent'
                  }`}
                  title="Open 4-Channel Soundscape Mixer & Sleep Timer"
                >
                  <Sliders size={13} className="text-[#D4A359]" />
                  <span className="hidden md:inline">
                    {sleepRemainingSecs > 0
                      ? `${Math.ceil(sleepRemainingSecs / 60)}m`
                      : 'Atmosphere'}
                  </span>
                </button>
              )}

              {/* Queue Modal Trigger */}
              {onOpenPlaylistModal && (
                <button
                  onClick={onOpenPlaylistModal}
                  className="p-2 text-[#9E968B] hover:text-[#F4EFE8] hover:bg-white/[0.06] rounded-full transition-all cursor-pointer"
                  title={
                    nextSong ? `Up Next: ${nextSong.title}` : 'Open Station Queue'
                  }
                >
                  <ListMusic size={15} />
                </button>
              )}

              {/* Share Postcard */}
              <button
                onClick={onOpenShare}
                className="p-2 text-[#9E968B] hover:text-[#F4EFE8] hover:bg-white/[0.06] rounded-full transition-all cursor-pointer"
                title="Share Vinyl Postcard"
              >
                <Share2 size={15} />
              </button>

              {/* Volume Control */}
              <div
                className="relative flex items-center"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button
                  onClick={onToggleMute}
                  className="p-2 text-[#9E968B] hover:text-[#F4EFE8] hover:bg-white/[0.06] rounded-full transition-all cursor-pointer"
                  title="Mute / Unmute (M)"
                >
                  {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>

                {showVolumeSlider && (
                  <div className="absolute bottom-full right-0 mb-3 px-3.5 py-2.5 luxury-modal rounded-2xl flex items-center gap-2.5 z-50">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => onChangeVolume(Number(e.target.value))}
                      className="w-20 h-1 accent-[#D4A359] cursor-pointer"
                    />
                    <span className="text-[10px] text-[#EAE5DF]/80 w-7 font-mono-tabular">
                      {isMuted ? '0' : volume}%
                    </span>
                  </div>
                )}
              </div>

              {/* Fullscreen Toggle */}
              <button
                onClick={onToggleFullscreen}
                className="p-2 text-[#9E968B] hover:text-[#F4EFE8] hover:bg-white/[0.06] rounded-full transition-all cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
              >
                {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
