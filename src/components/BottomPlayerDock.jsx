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
      {/* Floating Bottom Player Bar */}
      <div className="fixed bottom-5 sm:bottom-6 inset-x-0 z-40 flex justify-center pointer-events-none px-3 sm:px-4">
        <div className="pointer-events-auto w-full max-w-[710px] h-[72px] sm:h-[76px] flex items-center justify-between px-3 sm:px-5 rounded-[20px] bg-[#140f0c]/85 backdrop-blur-2xl border border-white/[0.09] shadow-[0_16px_45px_rgba(0,0,0,0.85)] text-[#F4EFE8]">

          {/* LEFT: Previous, Play/Pause, Next */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            <button
              onClick={onPrev}
              className="p-1.5 sm:p-2 text-[#F4EFE8]/60 hover:text-white hover:bg-white/[0.08] rounded-full transition active:scale-90"
              title="Previous"
            >
              <SkipBack size={18} />
            </button>

            {/* Circular Solid Off-White Play Button */}
            <button
              onClick={onTogglePlay}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#F4EFE8] text-[#140e0a] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-md"
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
              className="p-1.5 sm:p-2 text-[#F4EFE8]/60 hover:text-white hover:bg-white/[0.08] rounded-full transition active:scale-90"
              title="Next"
            >
              <SkipForward size={18} />
            </button>
          </div>

          {/* MIDDLE: Mini Cover + Title/Time + Artist + Progress */}
          <div className="flex-1 min-w-0 mx-2.5 sm:mx-4 flex items-center gap-2.5 sm:gap-3">
            {/* Mini Album Cover */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[8px] overflow-hidden flex-shrink-0 bg-black/50 border border-white/10 shadow-sm">
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
                <span className="text-[12.5px] sm:text-[13.5px] font-semibold text-[#F4EFE8] truncate leading-tight tracking-wide">
                  {currentSong?.title}
                </span>

                <span className="text-[10.5px] sm:text-[11px] text-[#F4EFE8]/45 flex-shrink-0 font-mono tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Row 2: Artist */}
              <span className="text-[10.5px] sm:text-[11px] text-[#F4EFE8]/55 truncate leading-tight mt-0.5">
                {currentSong?.artist}
              </span>

              {/* Row 3: Thin Sleek Scrubbable Progress Bar */}
              <div
                onClick={handleProgressBarClick}
                className="relative w-full h-[3px] bg-white/15 rounded-full cursor-pointer overflow-hidden group hover:h-[5px] transition-all mt-1.5"
                title="Seek"
              >
                <div
                  className="absolute top-0 left-0 bottom-0 bg-[#F4EFE8] group-hover:bg-amber-400 rounded-full transition-colors duration-150"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Repeat, Shuffle, Share, Volume */}
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
            <button
              onClick={onToggleRepeat}
              className={`p-1.5 rounded-full transition ${
                repeatMode !== 'off'
                  ? 'text-amber-400 bg-amber-400/15'
                  : 'text-[#F4EFE8]/50 hover:text-white hover:bg-white/[0.08]'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 size={15} /> : <Repeat size={15} />}
            </button>

            <button
              onClick={onToggleShuffle}
              className={`p-1.5 rounded-full transition ${
                isShuffle
                  ? 'text-amber-400 bg-amber-400/15'
                  : 'text-[#F4EFE8]/50 hover:text-white hover:bg-white/[0.08]'
              }`}
              title="Shuffle"
            >
              <Shuffle size={15} />
            </button>

            <button
              onClick={onOpenShare}
              className="p-1.5 text-[#F4EFE8]/50 hover:text-white hover:bg-white/[0.08] rounded-full transition"
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
                className="p-1.5 text-[#F4EFE8]/50 hover:text-white hover:bg-white/[0.08] rounded-full transition"
                title="Mute / Unmute"
              >
                {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>

              {showVolumeSlider && (
                <div className="absolute bottom-full right-0 mb-3 px-3 py-2 bg-[#1c1511]/95 border border-white/15 rounded-xl shadow-2xl backdrop-blur-xl flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => onChangeVolume(Number(e.target.value))}
                    className="w-20 h-1 accent-amber-400 cursor-pointer"
                  />
                  <span className="text-[10px] text-white/60 w-7 font-mono tabular-nums">
                    {isMuted ? '0' : volume}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Discrete Fullscreen Toggle in corner */}
      <button
        onClick={onToggleFullscreen}
        className="fixed bottom-5 right-4 sm:right-6 z-40 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-xl border border-white/[0.10] text-[#F4EFE8]/50 hover:text-white shadow-lg transition-all active:scale-95"
        title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
      >
        {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
      </button>
    </>
  );
}
