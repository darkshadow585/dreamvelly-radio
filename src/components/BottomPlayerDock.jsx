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
} from 'lucide-react';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function BottomPlayerDock({
  currentSong,
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
  isFullscreen,
  onToggleFullscreen,
}) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const handleProgressBarClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    if (duration > 0) {
      onSeek(percentage * duration);
    }
  };

  return (
    <>
      {/* Floating Bottom Player Bar with True Liquid Glassmorphism */}
      <div className="fixed bottom-3 sm:bottom-6 inset-x-0 z-40 flex justify-center pointer-events-none px-2.5 sm:px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        
        {/* ========================================================= */}
        {/* 1. MOBILE DOCK LAYOUT (< 640px)                           */}
        {/* ========================================================= */}
        <div className="flex sm:hidden relative pointer-events-auto w-full max-w-[500px] flex-col rounded-[22px] glass-dock text-[#F4EFE8] overflow-hidden p-2.5 pt-2 shadow-2xl">
          {/* Specular Top Glare Hairline */}
          <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

          {/* Top Row: Timestamps & Scrubbable Progress Bar */}
          <div className="w-full flex flex-col gap-1 mb-1 select-none">
            <div
              onClick={handleProgressBarClick}
              className="relative w-full h-[12px] flex items-center cursor-pointer group select-none"
              title="Seek"
            >
              <div className="w-full h-[3.5px] bg-white/20 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 rounded-full transition-all duration-100 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_6px_rgba(251,191,36,0.9)] pointer-events-none transition-all duration-100"
                style={{ left: `calc(${progressPercent}% - 5px)` }}
              />
            </div>

            {/* Dedicated micro-timestamps row */}
            <div className="flex items-center justify-between text-[9.5px] text-[#F4EFE8]/50 font-mono tabular-nums px-0.5 -mt-1 leading-none">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls & Track Info Row */}
          <div className="flex items-center justify-between gap-2.5 relative z-10">
            {/* Left: Mini Album Cover + Title + Full Artist line */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                className={`w-10 h-10 rounded-[10px] overflow-hidden flex-shrink-0 bg-black/50 border transition-all duration-300 shadow-sm ${
                  isPlaying
                    ? 'border-amber-400/60 ring-1 ring-amber-400/30 shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                    : 'border-white/15'
                }`}
              >
                <img
                  src={currentSong?.cover}
                  alt={currentSong?.title}
                  className="w-full h-full object-cover select-none pointer-events-none"
                  loading="eager"
                  draggable="false"
                />
              </div>

              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <h4 className="text-[12.5px] font-semibold text-[#F4EFE8] truncate leading-tight tracking-wide">
                  {currentSong?.title}
                </h4>
                <p className="text-[10.5px] text-[#F4EFE8]/65 truncate leading-tight mt-0.5 font-normal">
                  {currentSong?.artist}
                </p>
              </div>
            </div>

            {/* Right: Touch Friendly Player Buttons */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={onPrev}
                className="p-1.5 text-[#F4EFE8]/70 hover:text-white active:scale-90 transition-all rounded-full"
                title="Previous"
              >
                <SkipBack size={17} />
              </button>

              <button
                onClick={onTogglePlay}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 mx-0.5 ${
                  isPlaying
                    ? 'bg-amber-300 text-[#140e0a] shadow-[0_0_20px_rgba(251,191,36,0.6),0_4px_14px_rgba(0,0,0,0.5)] ring-2 ring-amber-300/80'
                    : 'bg-[#F4EFE8] text-[#140e0a] shadow-[0_0_12px_rgba(255,255,255,0.25),0_4px_12px_rgba(0,0,0,0.4)]'
                }`}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isBuffering ? (
                  <Loader2 size={18} className="animate-spin text-[#140e0a]" />
                ) : isPlaying ? (
                  <Pause size={17} fill="currentColor" />
                ) : (
                  <Play size={17} fill="currentColor" className="ml-0.5" />
                )}
              </button>

              <button
                onClick={onNext}
                className="p-1.5 text-[#F4EFE8]/70 hover:text-white active:scale-90 transition-all rounded-full"
                title="Next"
              >
                <SkipForward size={17} />
              </button>

              <button
                onClick={onToggleShuffle}
                className={`p-1.5 rounded-full transition-all active:scale-90 ${
                  isShuffle
                    ? 'text-amber-300 bg-amber-400/20'
                    : 'text-[#F4EFE8]/50 hover:text-white'
                }`}
                title="Shuffle"
              >
                <Shuffle size={15} />
              </button>

              <button
                onClick={onOpenShare}
                className="p-1.5 text-[#F4EFE8]/50 hover:text-white active:scale-90 transition-all rounded-full"
                title="Share"
              >
                <Share2 size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. DESKTOP DOCK LAYOUT (≥ 640px)                          */}
        {/* ========================================================= */}
        <div className="hidden sm:flex relative pointer-events-auto w-full max-w-[720px] h-[78px] items-center justify-between px-5 rounded-[22px] glass-dock text-[#F4EFE8] overflow-hidden">
          {/* Specular Top Glare Hairline */}
          <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

          {/* LEFT: Previous, Play/Pause, Next */}
          <div className="flex items-center gap-1.5 flex-shrink-0 relative z-10">
            <button
              onClick={onPrev}
              className="p-2 text-[#F4EFE8]/65 hover:text-white hover:bg-white/[0.10] rounded-full transition-all active:scale-90"
              title="Previous"
            >
              <SkipBack size={18} />
            </button>

            {/* Circular Glowing Play/Pause Button */}
            <button
              onClick={onTogglePlay}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${
                isPlaying
                  ? 'bg-amber-300 text-[#140e0a] shadow-[0_0_20px_rgba(251,191,36,0.6),0_4px_14px_rgba(0,0,0,0.5)] ring-2 ring-amber-300/80'
                  : 'bg-[#F4EFE8] text-[#140e0a] hover:bg-white shadow-[0_0_12px_rgba(255,255,255,0.25),0_4px_12px_rgba(0,0,0,0.4)]'
              }`}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isBuffering ? (
                <Loader2 size={19} className="animate-spin text-[#140e0a]" />
              ) : isPlaying ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" className="ml-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              className="p-2 text-[#F4EFE8]/65 hover:text-white hover:bg-white/[0.10] rounded-full transition-all active:scale-90"
              title="Next"
            >
              <SkipForward size={18} />
            </button>
          </div>

          {/* MIDDLE: Mini Cover + Title/Time + Artist + Progress */}
          <div className="flex-1 min-w-0 mx-4 flex items-center gap-3 relative z-10">
            {/* Mini Album Cover with Play glow */}
            <div
              className={`w-11 h-11 rounded-[10px] overflow-hidden flex-shrink-0 bg-black/50 border transition-all duration-300 shadow-sm ${
                isPlaying
                  ? 'border-amber-400/60 ring-1 ring-amber-400/30 shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                  : 'border-white/15'
              }`}
            >
              <img
                src={currentSong?.cover}
                alt={currentSong?.title}
                className="w-full h-full object-cover select-none pointer-events-none"
                loading="eager"
                draggable="false"
              />
            </div>

            {/* Song Meta and Progress */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              {/* Row 1: Title and Timestamps */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13.5px] font-semibold text-[#F4EFE8] truncate leading-tight tracking-wide">
                  {currentSong?.title}
                </span>

                <span className="text-[11px] text-[#F4EFE8]/50 flex-shrink-0 font-mono tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Row 2: Artist */}
              <span className="text-[11px] text-[#F4EFE8]/60 truncate leading-tight mt-0.5 font-normal">
                {currentSong?.artist}
              </span>

              {/* Row 3: Thin Sleek Scrubbable Progress Bar */}
              <div
                onClick={handleProgressBarClick}
                className="relative w-full h-[3.5px] bg-white/15 rounded-full cursor-pointer group hover:h-[5.5px] transition-all duration-200 mt-1.5 flex items-center"
                title="Seek"
              >
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 rounded-full relative transition-all duration-100 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                  style={{ width: `${progressPercent}%` }}
                >
                  {/* Glowing scrub thumb */}
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_6px_rgba(251,191,36,0.9)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Repeat, Shuffle, Share, Volume */}
          <div className="flex items-center gap-1 flex-shrink-0 relative z-10">
            <button
              onClick={onToggleRepeat}
              className={`p-1.5 rounded-full transition-all ${
                repeatMode !== 'off'
                  ? 'text-amber-300 bg-amber-400/20 border border-amber-400/35 shadow-[0_0_10px_rgba(251,191,36,0.25)]'
                  : 'text-[#F4EFE8]/55 hover:text-white hover:bg-white/[0.10]'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 size={15} /> : <Repeat size={15} />}
            </button>

            <button
              onClick={onToggleShuffle}
              className={`p-1.5 rounded-full transition-all ${
                isShuffle
                  ? 'text-amber-300 bg-amber-400/20 border border-amber-400/35 shadow-[0_0_10px_rgba(251,191,36,0.25)]'
                  : 'text-[#F4EFE8]/55 hover:text-white hover:bg-white/[0.10]'
              }`}
              title="Shuffle"
            >
              <Shuffle size={15} />
            </button>

            <button
              onClick={onOpenShare}
              className="p-1.5 text-[#F4EFE8]/55 hover:text-white hover:bg-white/[0.10] rounded-full transition-all"
              title="Share"
            >
              <Share2 size={15} />
            </button>

            {/* Volume */}
            <div
              className="relative flex items-center"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                onClick={onToggleMute}
                className="p-1.5 text-[#F4EFE8]/55 hover:text-white hover:bg-white/[0.10] rounded-full transition-all"
                title="Mute / Unmute"
              >
                {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>

              {showVolumeSlider && (
                <div className="absolute bottom-full right-0 mb-3 px-3.5 py-2.5 glass-dock rounded-2xl shadow-2xl backdrop-blur-3xl flex items-center gap-2.5 z-50">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => onChangeVolume(Number(e.target.value))}
                    className="w-20 h-1 accent-amber-400 cursor-pointer"
                  />
                  <span className="text-[10px] text-white/70 w-7 font-mono tabular-nums">
                    {isMuted ? '0' : volume}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Discrete Fullscreen Toggle in corner (Only on desktop/tablet to prevent collision with mobile player dock) */}
      <button
        onClick={onToggleFullscreen}
        className="hidden md:flex fixed bottom-6 right-6 z-40 p-2.5 rounded-full glass-dock text-[#F4EFE8]/60 hover:text-white hover:border-amber-400/30 transition-all active:scale-95"
        title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
      >
        {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
      </button>
    </>
  );
}
