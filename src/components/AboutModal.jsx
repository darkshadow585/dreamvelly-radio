import React from 'react';
import { X, Keyboard, Feather, Headphones, Disc3 } from 'lucide-react';

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg luxury-modal rounded-3xl overflow-hidden p-6 sm:p-8 text-[#F4EFE8]"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-3.5">
            <img
              src="/ks_logo.png"
              alt="KS Logo"
              className="w-11 h-11 rounded-full object-cover border border-[#D4A359]/45 shadow-lg"
            />
            <div>
              <div className="text-[10px] font-mono-tabular uppercase tracking-[0.22em] text-[#D4A359]">
                Curated by KS
              </div>
              <h3 className="text-xl sm:text-2xl font-editorial font-semibold text-[#F4EFE8]">
                Dreamvalley Sanctuary
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8C857B] hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-[#B8B0A4] leading-relaxed max-h-[68vh] overflow-y-auto no-scrollbar">
          <p className="font-editorial text-base sm:text-lg text-[#EAE5DF] leading-relaxed">
            An atmospheric listening room uniting curated monsoon, romantic, and indie vinyl
            stations with a private literary storytelling desk.
          </p>

          {/* Feature Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#12100e] border border-white/[0.06] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#F4EFE8]">
                <Headphones size={14} className="text-[#D4A359]" />
                <span>4 Spatial Worlds</span>
              </div>
              <p className="text-xs text-[#8C857B] leading-relaxed">
                Barish Monsoon, Dreamvalley, Iceland Aurora, and Misty Indie with real-time weather
                canvases.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#12100e] border border-white/[0.06] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#F4EFE8]">
                <Feather size={14} className="text-[#D4A359]" />
                <span>The Writer&apos;s Desk</span>
              </div>
              <p className="text-xs text-[#8C857B] leading-relaxed">
                Bespoke original fiction and verified web archive narratives with synchronized voice
                and Focus Mode.
              </p>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="p-4 rounded-2xl bg-[#0b0a09] border border-white/[0.07] space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#EAE5DF]">
              <Keyboard size={14} className="text-[#D4A359]" />
              <span>Keyboard Controls</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#9E968B]">
              <div className="flex items-center justify-between bg-white/[0.03] px-3 py-2 rounded-xl">
                <span>Play / Pause</span>
                <kbd className="font-mono-tabular text-[#F4EFE8] text-[11px]">Space</kbd>
              </div>
              <div className="flex items-center justify-between bg-white/[0.03] px-3 py-2 rounded-xl">
                <span>Glide Tracks</span>
                <kbd className="font-mono-tabular text-[#F4EFE8] text-[11px]">← / →</kbd>
              </div>
              <div className="flex items-center justify-between bg-white/[0.03] px-3 py-2 rounded-xl">
                <span>Search / Stream</span>
                <kbd className="font-mono-tabular text-[#F4EFE8] text-[11px]">⌘K or /</kbd>
              </div>
              <div className="flex items-center justify-between bg-white/[0.03] px-3 py-2 rounded-xl">
                <span>Fullscreen / Focus</span>
                <kbd className="font-mono-tabular text-[#F4EFE8] text-[11px]">F</kbd>
              </div>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-[11px] font-mono-tabular text-[#8C857B]">
            <span className="flex items-center gap-1.5">
              <Disc3 size={12} className="text-[#D4A359]" />
              <span>Dreamvalley Edition</span>
            </span>
            <span>Crafted by KS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
