import React, { useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';

export default function ShareModal({
  isOpen,
  onClose,
  currentSong,
  currentPlaylistId,
  activePlaylistName,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/?playlist=${currentPlaylistId}&song=${currentSong?.id}`;
  const cleanStation = (activePlaylistName || 'Dreamvalley').replace(/[^\w\s-]/g, '').trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md luxury-modal rounded-3xl overflow-hidden p-6 sm:p-7 text-[#F4EFE8]"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <Share2 size={16} className="text-[#D4A359]" />
            <h3 className="text-base font-semibold tracking-wide text-[#F4EFE8]">
              Share Track Postcard
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8C857B] hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Clean Artwork Postcard Preview (No Plate) */}
        <div className="relative p-5 rounded-2xl bg-[#12100e] border border-white/[0.08] mb-6 flex items-center gap-4 overflow-hidden shadow-2xl">
          <div className="relative z-10 w-20 h-20 rounded-xl overflow-hidden border border-white/20 shadow-xl bg-black flex-shrink-0">
            <img
              src={currentSong?.cover}
              alt={currentSong?.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-mono-tabular uppercase tracking-[0.2em] text-[#D4A359] mb-1">
              {cleanStation}
            </div>
            <h4 className="text-lg font-editorial font-semibold text-[#F4EFE8] truncate leading-tight">
              {currentSong?.title}
            </h4>
            <p className="text-xs text-[#9E968B] truncate mt-1">
              {currentSong?.artist}
              {currentSong?.movie ? ` · ${currentSong.movie}` : ''}
            </p>
          </div>
        </div>

        {/* Direct Link Copy Box */}
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-[#0b0a09] border border-white/[0.08]">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="bg-transparent text-xs text-[#A8A096] flex-1 outline-none font-mono-tabular truncate px-3"
          />
          <button
            onClick={handleCopy}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              copied
                ? 'bg-[#D4A359] text-[#090807]'
                : 'bg-[#F4EFE8] text-[#090807] hover:bg-white active:scale-95'
            }`}
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
