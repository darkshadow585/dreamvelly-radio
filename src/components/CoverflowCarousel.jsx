import React, { useRef, useState, useEffect } from 'react';

export default function CoverflowCarousel({
  songs,
  activeIndex,
  onSelectSong,
  isPlaying,
  activePlaylist,
}) {
  const containerRef = useRef(null);
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
  const line1 = activePlaylist?.titleLine1 || 'DREAMVELLY';
  const line2 = activePlaylist?.titleLine2 || '2026';

  // Responsive device classification based on state
  const isSmallMobile = windowWidth < 380;
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  const cardWidth = isSmallMobile ? 152 : isMobile ? 165 : isTablet ? 185 : 206;
  const cardHeight = isSmallMobile ? 198 : isMobile ? 212 : isTablet ? 236 : 256;
  const carouselHeight = isMobile ? '236px' : '280px';
  // On mobile, modest negative margin (-14px) ensures line 2 "RADIO" is completely readable
  // On desktop, -62px overlaps display typography cleanly as in Image 1
  const carouselMarginTop = isSmallMobile ? '-10px' : isMobile ? '-14px' : '-62px';

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

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-start pt-16 sm:pt-10 md:pt-7 select-none overflow-hidden">
      {/* 
        1. HERO HEADING — DYNAMIC PLAYLIST TITLE:
        Teko bold display font, warm off-white, tight leading, sitting behind the carousel cards.
      */}
      <div className="flex flex-col items-center justify-center z-[5] pointer-events-none px-4 select-none">
        <h1
          className="text-[3.4rem] sm:text-[4.8rem] md:text-[6.4rem] lg:text-[7.6rem] font-bold text-[#F4EFE8] text-center leading-[0.88] uppercase transition-all duration-300"
          style={{
            fontFamily: '"Teko", "TekoHindi", sans-serif',
            letterSpacing: '0.02em',
            textShadow: '0 4px 30px rgba(0,0,0,0.85), 0 2px 12px rgba(0,0,0,0.65)',
          }}
        >
          {line1}<br />{line2}
        </h1>
      </div>

      {/* 
        2. 5-CARD DEPTH CAROUSEL:
        Positioned right below title, overlapping line 2 cleanly without obscuring the text.
        Center card is dominant, facing forward flat.
      */}
      <div
        ref={containerRef}
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerUp}
        className="relative z-10 w-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
        style={{
          height: carouselHeight,
          marginTop: carouselMarginTop,
        }}
      >
        {songs.map((song, idx) => {
          // Circular relative offset so all 5 positions (-2, -1, 0, 1, 2) are always filled
          let offset = idx - activeIndex;
          if (offset > totalSongs / 2) offset -= totalSongs;
          if (offset < -totalSongs / 2) offset += totalSongs;

          const absOffset = Math.abs(offset);

          // Only render visible and entering/exiting cards (up to 3 away)
          if (absOffset > 3) return null;

          const isCenter = offset === 0;

          // Depth Curve calculations:
          let translateX = 0;
          let scale = 1;
          let zIndex = 30;
          let opacity = 1;
          let brightness = 1;
          let blurAmount = 0;

          if (isCenter) {
            translateX = 0;
            scale = 1;
            zIndex = 30;
            opacity = 1;
            brightness = 1;
            blurAmount = 0;
          } else if (absOffset === 1) {
            const step1 = isSmallMobile ? 78 : isMobile ? 84 : isTablet ? 128 : 148;
            translateX = offset * step1;
            scale = isMobile ? 0.84 : 0.88;
            zIndex = 20;
            opacity = isMobile ? 0.88 : 0.92;
            brightness = 0.78;
            blurAmount = 0;
          } else if (absOffset === 2) {
            const step1 = isSmallMobile ? 78 : isMobile ? 84 : isTablet ? 128 : 148;
            const step2 = isSmallMobile ? 54 : isMobile ? 62 : isTablet ? 105 : 122;
            translateX = Math.sign(offset) * (step1 + step2);
            scale = isMobile ? 0.68 : 0.75;
            zIndex = 10;
            opacity = isMobile ? 0.30 : 0.72;
            brightness = isMobile ? 0.40 : 0.58;
            blurAmount = isMobile ? 1.2 : 0.7;
          } else {
            // absOffset === 3 (entering/exiting buffer)
            const step1 = isSmallMobile ? 78 : isMobile ? 84 : isTablet ? 128 : 148;
            const step2 = isSmallMobile ? 54 : isMobile ? 62 : isTablet ? 105 : 122;
            translateX = Math.sign(offset) * (step1 + step2 + (isMobile ? 50 : 100));
            scale = isMobile ? 0.55 : 0.62;
            zIndex = 5;
            opacity = 0;
            brightness = 0.3;
            blurAmount = 2;
          }

          return (
            <div
              key={song.id}
              onClick={() => onSelectSong(idx)}
              style={{
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                transform: `translateX(${translateX}px) scale(${scale})`,
                zIndex,
                opacity,
                filter: `brightness(${brightness}) ${blurAmount > 0 ? `blur(${blurAmount}px)` : ''}`,
                transition: 'transform 0.48s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.48s cubic-bezier(0.25, 1, 0.5, 1), filter 0.48s cubic-bezier(0.25, 1, 0.5, 1)',
              }}
              className="absolute cursor-pointer group will-change-transform select-none"
            >
              {/* 1. Ambient Golden Halo / Glow behind Center Card */}
              {isCenter && (
                <div
                  className={`absolute -inset-2.5 rounded-[24px] pointer-events-none transition-all duration-700 -z-10 ${
                    isPlaying
                      ? 'bg-gradient-to-t from-amber-500/50 via-amber-400/40 to-yellow-500/30 blur-xl opacity-90 animate-pulse-halo'
                      : 'bg-amber-400/20 blur-lg opacity-40'
                  }`}
                />
              )}

              {/* 2. Main Song Card with Animated Glowing Border */}
              <div
                className={`relative w-full h-full rounded-[16px] overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                  isCenter
                    ? isPlaying
                      ? 'ring-2 ring-amber-400/90 shadow-[0_0_25px_rgba(251,191,36,0.6),0_0_60px_rgba(245,158,11,0.3),0_24px_60px_rgba(0,0,0,0.95)]'
                      : 'ring-1 ring-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.25),0_20px_50px_rgba(0,0,0,0.85)]'
                    : absOffset === 1
                    ? 'ring-1 ring-white/10 shadow-[0_14px_35px_rgba(0,0,0,0.7)]'
                    : 'shadow-[0_10px_25px_rgba(0,0,0,0.6)]'
                }`}
              >
                {/* Internal Container with Glass Tint */}
                <div className="w-full h-full bg-[#181310]/90 backdrop-blur-xl border border-white/[0.10] rounded-[16px] overflow-hidden flex flex-col justify-between relative">
                  
                  {/* Shimmering Top Specular Glass Sheen on Center Card */}
                  {isCenter && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-amber-200/[0.08] pointer-events-none z-10" />
                  )}

                  {/* Album Artwork */}
                  <div className="relative w-full flex-1 overflow-hidden bg-black/50">
                    <img
                      src={song.cover}
                      alt={song.title}
                      className="w-full h-full object-cover select-none pointer-events-none"
                      loading="eager"
                      draggable="false"
                    />

                    {/* Dark bottom gradient on artwork */}
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#181310] via-[#181310]/60 to-transparent pointer-events-none" />
                  </div>

                  {/* Song Title and Artist (Centered at bottom) */}
                  <div className="px-2.5 py-2 sm:py-2.5 text-center bg-[#181310]/95 flex flex-col justify-center min-h-[50px] sm:min-h-[56px] relative z-10">
                    <h3
                      className={`font-semibold truncate leading-tight tracking-wide ${
                        isCenter
                          ? 'text-[12px] sm:text-[13.5px] text-[#F4EFE8]'
                          : 'text-[10px] sm:text-[11.5px] text-[#F4EFE8]/85'
                      }`}
                    >
                      {song.title}
                    </h3>
                    <p
                      className={`truncate mt-0.5 leading-tight ${
                        isCenter
                          ? 'text-[10px] sm:text-[11px] text-[#F4EFE8]/60 font-normal'
                          : 'text-[9px] sm:text-[10px] text-[#F4EFE8]/40 font-normal'
                      }`}
                    >
                      {song.artist}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
