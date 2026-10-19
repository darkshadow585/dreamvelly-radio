import React from 'react';
import {
  X,
  CloudRain,
  Waves,
  Disc3,
  Flame,
  Timer,
  Sliders,
  RotateCcw,
} from 'lucide-react';

const SOUNDSCAPE_PRESETS = [
  {
    id: 'monsoon_vinyl',
    label: 'Monsoon Vinyl',
    values: { rain: 0.45, waves: 0, vinyl: 0.35, fire: 0 },
  },
  {
    id: 'fireplace_study',
    label: 'Hearth & Rain',
    values: { rain: 0.35, waves: 0, vinyl: 0.2, fire: 0.5 },
  },
  {
    id: 'midnight_coast',
    label: 'Midnight Coast',
    values: { rain: 0, waves: 0.5, vinyl: 0.2, fire: 0.3 },
  },
  {
    id: 'pure_turntable',
    label: 'Pure Turntable',
    values: { rain: 0, waves: 0, vinyl: 0.5, fire: 0 },
  },
];

const SLEEP_OPTIONS = [
  { label: 'Off', mins: 0 },
  { label: '15m', mins: 15 },
  { label: '30m', mins: 30 },
  { label: '45m', mins: 45 },
  { label: '60m', mins: 60 },
];

export default function SoundscapeModal({
  isOpen,
  onClose,
  layerVolumes,
  onChangeLayer,
  onResetLayers,
  sleepRemainingSecs,
  onSetSleepMinutes,
}) {
  if (!isOpen) return null;

  const formatSleepRemaining = (secs) => {
    if (!secs || secs <= 0) return null;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const channels = [
    {
      id: 'rain',
      label: 'Monsoon Rain',
      sub: 'Soft window patter & distant droplets',
      icon: CloudRain,
    },
    {
      id: 'vinyl',
      label: 'Analog Vinyl Crackle',
      sub: 'Warm stylus surface texture',
      icon: Disc3,
    },
    {
      id: 'fire',
      label: 'Fireplace Hearth',
      sub: 'Low-end cabin ember warmth',
      icon: Flame,
    },
    {
      id: 'waves',
      label: 'Midnight Ocean',
      sub: 'Rolling coastal surf cadence',
      icon: Waves,
    },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg luxury-modal rounded-3xl overflow-hidden p-6 sm:p-7 text-[#F4EFE8]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <Sliders size={16} className="text-[#D4A359]" />
            <div>
              <h3 className="text-base sm:text-lg font-editorial font-semibold text-[#F4EFE8]">
                Acoustic Atmosphere &amp; Sleep Studio
              </h3>
              <p className="text-xs text-[#8C857B]">
                Blend real-time environmental soundscapes over any station
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onResetLayers}
              className="p-2 text-[#8C857B] hover:text-[#EAE5DF] rounded-full hover:bg-white/[0.06] transition cursor-pointer"
              title="Reset all soundscape faders"
            >
              <RotateCcw size={15} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#8C857B] hover:text-white rounded-full hover:bg-white/[0.06] transition cursor-pointer"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* 1. One-Click Curated Soundscape Mixes */}
        <div className="mb-6">
          <div className="text-[11px] font-mono-tabular uppercase tracking-[0.18em] text-[#8C857B] mb-2.5">
            Curated Blends
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SOUNDSCAPE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  Object.entries(preset.values).forEach(([k, v]) => onChangeLayer(k, v));
                }}
                className="px-3 py-2 rounded-xl bg-[#12100e] hover:bg-white/[0.06] border border-white/[0.07] hover:border-[#D4A359]/50 text-xs font-medium text-[#EAE5DF] transition text-center cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. 4-Channel Tactile Faders */}
        <div className="space-y-3.5 mb-6">
          {channels.map((ch) => {
            const Icon = ch.icon;
            const val = layerVolumes[ch.id] || 0;
            const active = val > 0.01;
            return (
              <div
                key={ch.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  active
                    ? 'bg-[#17130f] border-[#D4A359]/45'
                    : 'bg-[#110f0d] border-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <Icon
                      size={15}
                      className={active ? 'text-[#D4A359]' : 'text-[#8C857B]'}
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#F4EFE8]">
                        {ch.label}
                      </div>
                      <div className="text-[11px] text-[#8C857B]">{ch.sub}</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono-tabular text-[#D4A359]">
                    {Math.round(val * 100)}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={val}
                  onChange={(e) => onChangeLayer(ch.id, parseFloat(e.target.value))}
                  className="w-full h-1.5 accent-[#D4A359] bg-white/10 rounded-lg cursor-pointer"
                />
              </div>
            );
          })}
        </div>

        {/* 3. Smart Sleep Timer */}
        <div className="pt-4 border-t border-white/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Timer size={15} className="text-[#D4A359]" />
            <div>
              <div className="text-xs font-semibold text-[#F4EFE8] flex items-center gap-2">
                <span>Sleep Timer</span>
                {sleepRemainingSecs > 0 && (
                  <span className="text-[11px] font-mono-tabular text-[#D4A359]">
                    {formatSleepRemaining(sleepRemainingSecs)} left
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#8C857B]">
                Gently pauses audio &amp; enters OLED Nightstand
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {SLEEP_OPTIONS.map((opt) => {
              const isSelected =
                opt.mins === 0
                  ? sleepRemainingSecs === 0
                  : Math.abs(sleepRemainingSecs - opt.mins * 60) < 60;
              return (
                <button
                  key={opt.label}
                  onClick={() => onSetSleepMinutes(opt.mins)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono-tabular transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#F4EFE8] text-[#090807] font-semibold'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] text-[#9E968B] hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
