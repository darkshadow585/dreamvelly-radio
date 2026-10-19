import React, { useState, useEffect } from 'react';
import { Moon } from 'lucide-react';

export default function ScreenOffOverlay({
  isActive,
  onClose,
  currentSong,
  isPlaying,
}) {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
      setDateStr(
        now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = () => {
      onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onClose]);

  if (!isActive) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-black text-[#F4EFE8] flex flex-col justify-between items-center p-8 sm:p-14 select-none cursor-pointer transition-opacity duration-500"
      style={{ backgroundColor: '#000000' }}
    >
      {/* Top Whisper Status */}
      <div className="w-full flex items-center justify-between opacity-25 hover:opacity-75 transition-opacity">
        <div className="flex items-center gap-2 text-[11px] font-mono-tabular tracking-[0.25em] uppercase text-[#D4A359]">
          <Moon size={13} />
          <span>OLED Nightstand</span>
        </div>
        <span className="text-[11px] font-mono-tabular tracking-[0.2em] uppercase text-white/40">
          {dateStr}
        </span>
      </div>

      {/* Center: Luxury Editorial Chronograph & Breathing Track Whisper */}
      <div className="flex flex-col items-center justify-center text-center space-y-7 pointer-events-none opacity-35 hover:opacity-85 transition-opacity duration-500">
        <div className="text-7xl sm:text-9xl font-editorial font-normal tracking-tight text-[#F4EFE8]/90 tabular-nums leading-none">
          {timeStr}
        </div>

        <div className="flex items-end justify-center gap-1.5 h-5">
          {[0.3, 0.7, 0.4, 1, 0.5, 0.8, 0.35].map((h, i) => (
            <span
              key={i}
              className="w-[2px] bg-[#D4A359] rounded-full animate-studio-wave"
              style={{
                height: isPlaying ? `${Math.round(h * 100)}%` : '20%',
                animationDelay: `${i * 0.14}s`,
              }}
            />
          ))}
        </div>

        <div className="space-y-1">
          <h2 className="text-base sm:text-xl font-editorial text-[#F4EFE8]/90 truncate max-w-xs sm:max-w-md">
            {currentSong?.title || 'Dreamvalley Sanctuary'}
          </h2>
          <p className="text-xs text-[#8C857B] truncate max-w-xs sm:max-w-md">
            {currentSong?.artist}
          </p>
        </div>
      </div>

      {/* Bottom Wake Hint */}
      <div className="text-[10px] font-mono-tabular tracking-[0.24em] uppercase text-white/20 text-center">
        Touch anywhere or press any key to wake
      </div>
    </div>
  );
}
