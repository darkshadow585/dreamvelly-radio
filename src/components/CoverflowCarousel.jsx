import React, { useRef, useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Feather,
  Search,
  ListMusic,
} from 'lucide-react';

export default function CoverflowCarousel({
  songs,
  activeIndex,
  onSelectSong,
  onTogglePlay,
  isPlaying,
  activePlaylist,
  onOpenSearch,
  onOpenStoryStudio,
  onOpenPlaylistModal,
}) {
  const containerRef = useRef(null);
  const wheelCooldownRef = useRef(0);
  const [dragStartX, setDragStartX] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalSongs = songs.length;
  const activeSong = songs[activeIndex] || songs[0];
  const line1 = activePlaylist?.titleLine1 || 'DREAMVALLEY';
  const line2 = activePlaylist?.titleLine2 || '2026';

  const isSmallMobile = windowWidth < 380;
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  const cardWidth = isSmallMobile ? 160 : isMobile ? 174 : isTablet ? 198 : 224;
  const cardHeight = isSmallMobile ? 206 : isMobile ? 222 : isTablet ? 250 : 276;
  const carouselHeight = isMobile ? '248px' : '300px';
  const carouselMarginTop = isSmallMobile ? '-12px' : isMobile ? '-16px' : '-56px';

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['input', 'textarea'].includes(e.target.tagName?.toLowerCase())) return;
      if (e.key === 'ArrowLeft') {
        onSelectSong((activeIndex - 1 + totalSongs) % totalSongs);
      }
      if (e.key === 'ArrowRight') {
        onSelectSong((activeIndex + 1) % totalSongs);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, totalSongs, onSelectSong]);

  // Smooth Mouse Wheel / Trackpad Horizontal Glide
  const handleWheel = (e) => {
    const now = Date.now();
    if (now - wheelCooldownRef.current < 240) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 18) return;

    wheelCooldownRef.current = now;
    if (delta > 0) {
      onSelectSong((activeIndex + 1) % totalSongs);
    } else {
      onSelectSong((activeIndex - 1 + totalSongs) % totalSongs);
    }
  };

  // Touch / Pointer Swipe handling
  const handlePointerDown = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
    setIsDragging(true);
  };

  const handlePointerUp = (e) => {
    if (!isDragging || dragStartX === null) return;
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const diff = clientX - dragStartX;

    if (diff > 40) {
      onSelectSong((activeIndex - 1 + totalSongs) % totalSongs);
    } else if (diff < -40) {
      onSelectSong((activeIndex + 1) % totalSongs);
    }
    setDragStartX(null);
    setIsDragging(false);
  };

  const handlePrevCard = (e) => {
    e.stopPropagation();
    onSelectSong((activeIndex - 1 + totalSongs) % totalSongs);
  };

  const handleNextCard = (e) => {
    e.stopPropagation();
    onSelectSong((activeIndex + 1) % totalSongs);
  };

  return (
    <div
      onWheel={handleWheel}
      className="absolute inset-0 flex flex-col items-center justify-start pt-16 sm:pt-14 md:pt-12 select-none overflow-hidden"
    >
      {/* 1. MONUMENTAL STATION TITLE & UNBOXED KICKER */}
      <div className="flex flex-col items-center justify-center z-[5] pointer-events-none px-4 select-none">
        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono-tabular uppercase tracking-[0.26em] text-[#EAE5DF]/60 mb-1">
          <span>{activePlaylist?.badge || 'Curated Atmosphere'}</span>
          <span aria-hidden="true">·</span>
          <span>
            Track {activeIndex + 1 < 10 ? `0${activeIndex + 1}` : activeIndex + 1} of{' '}
            {totalSongs}
          </span>
        </div>

        <h1
          className="text-[3.3rem] sm:text-[4.7rem] md:text-[6.2rem] lg:text-[7.4rem] font-bold text-[#F4EFE8] text-center leading-[0.86] uppercase transition-all duration-500 hero-heading"
        >
          {line1}
          <br />
          {line2}
        </h1>
      </div>

      {/* 2. 3D SPATIAL VINYL COVERFLOW STAGE */}
      <div
        ref={containerRef}
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerUp}
        className="relative z-10 w-full max-w-6xl flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
        style={{
          height: carouselHeight,
          marginTop: carouselMarginTop,
          perspective: '1200px',
        }}
      >
        {/* Left Navigation Arrow (Desktop) */}
        <button
          onClick={handlePrevCard}
          className="hidden md:flex absolute left-4 lg:left-10 z-40 w-11 h-11 rounded-full glass-dock hover:bg-[#F4EFE8] text-[#F4EFE8]/80 hover:text-[#090807] items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          title="Previous Track (←)"
          aria-label="Previous Track"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Right Navigation Arrow (Desktop) */}
        <button
          onClick={handleNextCard}
          className="hidden md:flex absolute right-4 lg:right-10 z-40 w-11 h-11 rounded-full glass-dock hover:bg-[#F4EFE8] text-[#F4EFE8]/80 hover:text-[#090807] items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          title="Next Track (→)"
          aria-label="Next Track"
        >
          <ChevronRight size={20} />
        </button>

        {songs.map((song, idx) => {
          let offset = idx - activeIndex;
          if (offset > totalSongs / 2) offset -= totalSongs;
          if (offset < -totalSongs / 2) offset += totalSongs;

          const absOffset = Math.abs(offset);
          if (absOffset > 3) return null;

          const isCenter = offset === 0;

          let translateX = 0;
          let scale = 1;
          let rotateY = 0;
          let zIndex = 30;
          let opacity = 1;
          let brightness = 1;
          let blurAmount = 0;

          if (isCenter) {
            translateX = 0;
            scale = 1;
            rotateY = 0;
            zIndex = 30;
            opacity = 1;
            brightness = 1;
            blurAmount = 0;
          } else if (absOffset === 1) {
            const step1 = isSmallMobile ? 82 : isMobile ? 90 : isTablet ? 142 : 168;
            translateX = offset * step1;
            scale = isMobile ? 0.84 : 0.87;
            rotateY = offset < 0 ? 14 : -14;
            zIndex = 20;
            opacity = isMobile ? 0.86 : 0.92;
            brightness = 0.74;
            blurAmount = 0;
          } else if (absOffset === 2) {
            const step1 = isSmallMobile ? 82 : isMobile ? 90 : isTablet ? 142 : 168;
            const step2 = isSmallMobile ? 54 : isMobile ? 64 : isTablet ? 108 : 132;
            translateX = Math.sign(offset) * (step1 + step2);
            scale = isMobile ? 0.68 : 0.74;
            rotateY = offset < 0 ? 22 : -22;
            zIndex = 10;
            opacity = isMobile ? 0.28 : 0.68;
            brightness = isMobile ? 0.42 : 0.54;
            blurAmount = isMobile ? 1.2 : 0.6;
          } else {
            const step1 = isSmallMobile ? 82 : isMobile ? 90 : isTablet ? 142 : 168;
            const step2 = isSmallMobile ? 54 : isMobile ? 64 : isTablet ? 108 : 132;
            translateX = Math.sign(offset) * (step1 + step2 + (isMobile ? 50 : 105));
            scale = isMobile ? 0.55 : 0.6;
            rotateY = offset < 0 ? 28 : -28;
            zIndex = 5;
            opacity = 0;
            brightness = 0.3;
            blurAmount = 2;
          }

          return (
            <div
              key={song.id}
              onClick={() => {
                if (isCenter && onTogglePlay) {
                  onTogglePlay();
                } else {
                  onSelectSong(idx);
                }
              }}
              style={{
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`,
                zIndex,
                opacity,
                filter: `brightness(${brightness}) ${
                  blurAmount > 0 ? `blur(${blurAmount}px)` : ''
                }`,
                transition:
                  'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1), filter 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              className="absolute cursor-pointer group will-change-transform select-none"
            >
              {/* 1. Warm Champagne Halo behind Active Center Sleeve */}
              {isCenter && (
                <div
                  className={`absolute -inset-4 rounded-[28px] pointer-events-none transition-all duration-700 -z-20 ${
                    isPlaying
                      ? 'bg-gradient-to-tr from-[#D4A359]/45 via-amber-500/25 to-sky-400/20 blur-2xl opacity-95 animate-pulse-halo'
                      : 'bg-[#D4A359]/15 blur-xl opacity-40'
                  }`}
                />
              )}

              {/* 2. Authentic Physical Grooved Vinyl LP Peeking Out from Center Sleeve */}
              {isCenter && (
                <div
                  className={`hidden sm:flex absolute top-1/2 -translate-y-1/2 -right-12 w-[176px] h-[176px] md:w-[196px] md:h-[196px] rounded-full vinyl-disc-surface items-center justify-center pointer-events-none -z-10 transition-all duration-700 ${
                    isPlaying
                      ? 'translate-x-5 opacity-100 animate-vinyl'
                      : 'translate-x-0 opacity-65'
                  }`}
                >
                  {/* Concentric Groove Rings */}
                  <div className="w-[132px] h-[132px] rounded-full border border-white/[0.06] flex items-center justify-center">
                    <div className="w-[96px] h-[96px] rounded-full border border-white/[0.05] flex items-center justify-center">
                      {/* Center Vinyl Artwork Label */}
                      <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#D4A359]/50 shadow-inner">
                        <img
                          src={song.cover}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {/* Spindle Hole */}
                        <div className="absolute inset-0 m-auto w-2.5 h-2.5 rounded-full bg-[#090807] border border-white/30" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Main Luxury Vinyl Sleeve Card */}
              <div
                className={`relative w-full h-full rounded-[20px] overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                  isCenter
                    ? isPlaying
                      ? 'ring-1 ring-[#D4A359]/85 shadow-[0_0_35px_rgba(212,163,89,0.4),0_26px_65px_rgba(0,0,0,0.95)]'
                      : 'ring-1 ring-white/25 shadow-[0_24px_55px_rgba(0,0,0,0.9)]'
                    : absOffset === 1
                    ? 'ring-1 ring-white/10 shadow-[0_16px_38px_rgba(0,0,0,0.75)]'
                    : 'shadow-[0_10px_25px_rgba(0,0,0,0.6)]'
                }`}
              >
                <div className="w-full h-full bg-[#0e0c0a]/95 backdrop-blur-xl border border-white/[0.08] rounded-[20px] overflow-hidden flex flex-col justify-between relative">
                  {/* Top Specular Edge */}
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent z-20 pointer-events-none" />

                  {/* Album Artwork */}
                  <div className="relative w-full flex-1 overflow-hidden bg-black/60">
                    <img
                      src={song.cover}
                      alt={song.title}
                      className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-105 transition-transform duration-700"
                      loading="eager"
                      draggable="false"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0e0c0a] via-[#0e0c0a]/75 to-transparent pointer-events-none" />

                    {/* Center Card Play/Pause Hover Glass Button */}
                    {isCenter && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-11 h-11 rounded-full bg-[#F4EFE8]/95 text-[#090807] flex items-center justify-center shadow-2xl transform scale-95 group-hover:scale-100 transition-transform">
                          {isPlaying ? (
                            <Pause size={18} fill="currentColor" />
                          ) : (
                            <Play size={18} fill="currentColor" className="ml-0.5" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Subtle Acoustic Wave Indicator in Corner of Active Card */}
                    {isCenter && isPlaying && (
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/65 backdrop-blur-md border border-white/15 flex items-end gap-[2px] h-5">
                        {[0.4, 1, 0.55, 0.85].map((h, i) => (
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
                    )}
                  </div>

                  {/* Sleeve Caption: Song Title & Artist */}
                  <div className="px-3.5 py-2.5 text-center bg-[#0e0c0a] flex flex-col justify-center min-h-[56px] sm:min-h-[62px] relative z-10">
                    <h3
                      className={`font-semibold truncate leading-tight tracking-wide ${
                        isCenter
                          ? 'text-[13px] sm:text-[14.5px] text-[#F4EFE8]'
                          : 'text-[11px] sm:text-[12px] text-white/75'
                      }`}
                    >
                      {song.title}
                    </h3>
                    <p
                      className={`truncate mt-0.5 leading-tight ${
                        isCenter
                          ? 'text-[11px] sm:text-[11.5px] text-[#A8A096]'
                          : 'text-[9.5px] sm:text-[10px] text-white/35'
                      }`}
                    >
                      {song.artist}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Subtle Floor Reflection Under Center Card */}
              {isCenter && (
                <div
                  aria-hidden="true"
                  className="hidden sm:block absolute left-0 right-0 -bottom-10 h-9 rounded-[20px] overflow-hidden pointer-events-none opacity-20 blur-[2px]"
                  style={{
                    transform: 'scaleY(-1)',
                    WebkitMaskImage:
                      'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 90%)',
                    maskImage:
                      'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 90%)',
                  }}
                >
                  <img
                    src={song.cover}
                    alt=""
                    className="w-full h-full object-cover object-bottom"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. LEVEL 5 STAGE PLINTH & QUICK STUDIO ACTIONS */}
      <div className="relative z-20 mt-4 sm:mt-6 flex flex-col items-center gap-2.5 px-4">
        {/* Unboxed Track Metadata Line */}
        {activeSong && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#EAE5DF]/70">
            <span className="font-medium text-[#F4EFE8]">{activeSong.title}</span>
            <span aria-hidden="true" className="text-white/30">
              ·
            </span>
            <span>{activeSong.artist}</span>
            {activeSong.movie && (
              <>
                <span aria-hidden="true" className="text-white/30">
                  ·
                </span>
                <span className="text-[#A8A096]">{activeSong.movie}</span>
              </>
            )}
          </div>
        )}

        {/* Interactive Studio Action Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {onOpenPlaylistModal && (
            <button
              onClick={onOpenPlaylistModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass-dock hover:border-white/30 text-xs text-[#EAE5DF]/85 hover:text-white transition cursor-pointer"
            >
              <ListMusic size={12} className="text-[#D4A359]" />
              <span>Station Queue ({totalSongs})</span>
            </button>
          )}

          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass-dock hover:border-white/30 text-xs text-[#EAE5DF]/85 hover:text-white transition cursor-pointer"
            >
              <Search size={12} className="text-[#D4A359]" />
              <span>Search or Paste YouTube Link</span>
            </button>
          )}

          {onOpenStoryStudio && (
            <button
              onClick={onOpenStoryStudio}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1f1912]/90 hover:bg-[#2a2117] border border-[#D4A359]/40 hover:border-[#D4A359] text-xs text-[#EAE5DF] transition shadow-lg cursor-pointer"
            >
              <Feather size={12} className="text-[#D4A359]" />
              <span>Enter The Writer&apos;s Desk</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
