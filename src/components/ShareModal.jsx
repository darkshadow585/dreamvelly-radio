import React, { useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';

export default function ShareModal({ isOpen, onClose, currentSong, currentPlaylistId }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/?playlist=${currentPlaylistId}&song=${currentSong?.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#1a1410] border border-white/15 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-amber-400" />
            <h3 className="text-base font-semibold text-white">Share this Song</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-white/10 mb-4">
          <img
            src={currentSong?.cover}
            alt={currentSong?.title}
            className="w-12 h-12 rounded-xl object-cover"
          />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">{currentSong?.title}</h4>
            <p className="text-xs text-white/50 truncate">
              {currentSong?.artist} • {currentSong?.movie}
            </p>
          </div>
        </div>

        <p className="text-xs text-white/60 mb-2">
          Anyone with this link can listen directly to this track:
        </p>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-black/50 border border-white/10 mb-4">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="bg-transparent text-xs text-white/80 flex-1 outline-none font-mono truncate px-2"
          />
          <button
            onClick={handleCopy}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-black hover:bg-white/90 active:scale-95'
            }`}
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={onClose}
            className="text-xs text-white/50 hover:text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
