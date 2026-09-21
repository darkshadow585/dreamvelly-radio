import React from 'react';
import { X, Heart, Sparkles } from 'lucide-react';

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#15110e] border border-amber-400/20 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden p-6 text-[#F4EFE8]"
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img
              src="/ks_logo.png"
              alt="KS Logo"
              className="w-10 h-10 rounded-full object-cover border border-amber-400/30 shadow-md"
            />
            <div>
              <h3 className="text-base font-semibold text-[#F4EFE8] flex items-center gap-1.5">
                KS Music Lounge <Sparkles size={14} className="text-amber-400" />
              </h3>
              <p className="text-[11px] text-[#F4EFE8]/50">Curated by KS • DREAMEVELLY & INDIE 2026</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3.5 text-xs sm:text-sm text-[#F4EFE8]/75 leading-relaxed max-h-[60vh] overflow-y-auto no-scrollbar">
          <p>
            <strong className="text-[#F4EFE8]">KS Music Lounge</strong> offers an exclusive, atmospheric
            cinematic music experience presenting timeless, soulful melodies across two distinct channels:
            <strong className="text-amber-300"> DREAMEVELLY 2026</strong> (romantic Bollywood anthems) and
            <strong className="text-amber-300"> INDIE 2026</strong> (Indian indie, acoustic & soulful waves).
          </p>
          <p>
            Immerse yourself in haunting vocals, acoustic harmonies, and evergreen classics
            paired with tranquil mountain valley visuals and ambient dusk grading.
          </p>

          <div className="p-3.5 rounded-2xl bg-black/45 border border-white/10 text-xs text-[#F4EFE8]/60">
            <strong className="text-[#F4EFE8] block mb-1">Playback & Audio Engine:</strong>
            Audio streams seamlessly through YouTube's embedded player. All song rights and master
            recordings belong to the original artists, composers, and respective record labels.
          </div>

          <div className="pt-2 text-center text-xs text-[#F4EFE8]/50 flex items-center justify-center gap-1">
            Curated with <Heart size={14} className="text-red-500 fill-red-500" /> by KS
          </div>
        </div>
      </div>
    </div>
  );
}
