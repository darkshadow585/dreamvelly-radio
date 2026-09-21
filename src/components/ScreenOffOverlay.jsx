import React, { useState, useEffect } from 'react';
import { Moon, Sparkles, Volume2 } from 'lucide-react';

export default function ScreenOffOverlay({
  isActive,
  onClose,
  currentSong,
  isPlaying,
}) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard wake up on any key press
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
      className="fixed inset-0 z-[9999] bg-black text-white flex flex-col justify-between items-center p-6 sm:p-10 select-none cursor-pointer transition-opacity duration-300"
      style={{ backgroundColor: '#000000' }}
    >
      {/* Top minimal status indicator */}
      <div className="w-full flex items-center justify-between opacity-25 hover:opacity-75 transition-opacity">
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-amber-200">
          <Moon size={14} className="animate-pulse" />
          <span>OLED SCREEN-OFF MODE</span>
        </div>
        <div className="text-xs font-mono text-white/50 tracking-wider">
          {timeStr}
        </div>
      </div>

      {/* Center: Minimalist ambient playing indicator */}
      <div className="flex flex-col items-center justify-center text-center gap-3 max-w-md pointer-events-none opacity-20 hover:opacity-85 transition-opacity duration-300">
        <div className="flex items-center gap-1.5 h-6">
          <span className="w-1 bg-amber-400/80 rounded-full h-3 animate-pulse" />
          <span className="w-1 bg-amber-400/80 rounded-full h-6 animate-pulse [animation-delay:0.2s]" />
          <span className="w-1 bg-amber-400/80 rounded-full h-4 animate-pulse [animation-delay:0.4s]" />
          <span className="w-1 bg-amber-400/80 rounded-full h-5 animate-pulse [animation-delay:0.1s]" />
          <span className="w-1 bg-amber-400/80 rounded-full h-2 animate-pulse [animation-delay:0.3s]" />
        </div>

        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-medium tracking-wide text-[#F4EFE8] truncate max-w-[280px] sm:max-w-md">
            {currentSong?.title || 'DREAMVALLEY Radio'}
          </h2>
          <p className="text-xs text-[#F4EFE8]/60 truncate max-w-[280px] sm:max-w-md">
            {currentSong?.artist || 'KS Lounge'} {currentSong?.movie ? `• ${currentSong.movie}` : ''}
          </p>
        </div>

        <div className="mt-2 text-[11px] tracking-widest uppercase text-amber-400/60 font-mono">
          {isPlaying ? 'Playing in Background' : 'Paused'}
        </div>
      </div>

      {/* Bottom hint */}
      <div className="text-[11px] font-mono tracking-wider text-white/30 text-center animate-pulse">
        Tap anywhere or press any key to wake screen
      </div>
    </div>
  );
}
