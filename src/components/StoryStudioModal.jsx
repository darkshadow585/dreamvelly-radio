import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CloudRain,
  Mic,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Volume2,
  Waves,
  ExternalLink,
  SkipForward,
  SkipBack,
  Feather,
} from 'lucide-react';
import {
  QUICK_GENERATE_SPARKS,
  QUICK_REAL_STORY_SPARKS,
  STORY_LANGUAGES,
  NARRATOR_VOICES,
  useStoryStudio,
} from '../hooks/useStoryStudio';

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export default function StoryStudioModal({
  isOpen,
  onClose,
  onPauseRadio,
  onResumeRadio,
}) {
  const [activeTab, setActiveTab] = useState('creator'); // 'creator' | 'reader'
  const [isFocusMode, setIsFocusMode] = useState(false);
  const activeParagraphRef = useRef(null);

  const {
    storyMode,
    setStoryMode,
    storyLanguage,
    setStoryLanguage,
    customPrompt,
    setCustomPrompt,
    selectedVoice,
    setVoice,
    isGenerating,
    progressPercent,
    storyData,
    storyHistory,
    loadHistoryStory,
    playSceneAtIndex,
    errorMessage,
    isPlaying,
    currentTime,
    duration,
    voiceVolume,
    setVoiceVolume,
    ambientEnabled,
    setAmbientEnabled,
    ambientVolume,
    setAmbientVolume,
    ambientType,
    setAmbientType,
    activeParagraphIndex,
    handleGenerateAndPlay,
    togglePlay,
    seekTo,
    stopAll,
  } = useStoryStudio({
    onAudioStarted: onPauseRadio,
    onAudioStopped: onResumeRadio,
  });

  const totalScenes = storyData?.paragraphs?.length || 0;
  const quickSparks =
    storyMode === 'real' ? QUICK_REAL_STORY_SPARKS : QUICK_GENERATE_SPARKS;

  // Switch to reader automatically when playback starts
  useEffect(() => {
    if (storyData && isPlaying && !isGenerating) {
      setActiveTab('reader');
    }
  }, [storyData, isPlaying, isGenerating]);

  // Smoothly center the currently narrated paragraph
  useEffect(() => {
    if (activeParagraphRef.current && activeTab === 'reader' && !isGenerating) {
      activeParagraphRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeParagraphIndex, activeTab, isGenerating]);

  // Keyboard shortcuts: ESC exits Focus Mode first (or closes modal), F toggles Focus Mode in reader
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (['input', 'textarea'].includes(e.target.tagName?.toLowerCase())) return;
      if (e.key === 'Escape') {
        if (isFocusMode) {
          setIsFocusMode(false);
        } else {
          handleClose();
        }
      } else if (e.key.toLowerCase() === 'f' && activeTab === 'reader' && storyData) {
        e.preventDefault();
        setIsFocusMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFocusMode, activeTab, storyData]);

  const handleClose = () => {
    setIsFocusMode(false);
    stopAll();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0908] text-[#EAE5DF] flex flex-col justify-between overflow-hidden animate-in fade-in duration-300 font-ui selection:bg-[#D4A359]/30">
      {/* Warm Brass Desk Lamp Radial Illumination */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -top-52 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-25 blur-[160px] transition-opacity duration-1000"
          style={{
            background:
              'radial-gradient(circle, rgba(212,163,89,0.28) 0%, rgba(120,85,40,0.08) 60%, transparent 100%)',
          }}
        />
      </div>

      {/* Subtle Floating Exit Focus Button when Focus Mode is active */}
      {isFocusMode && activeTab === 'reader' && (
        <button
          onClick={() => setIsFocusMode(false)}
          className="fixed top-6 right-6 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.1] border border-white/[0.07] text-xs text-[#8C857B] hover:text-[#EAE5DF] opacity-25 hover:opacity-100 transition-all duration-300 cursor-pointer"
          title="Exit Focus Mode (Esc)"
        >
          <EyeOff size={13} />
          <span>Exit Focus</span>
        </button>
      )}

      {/* ================= 1. MINIMALIST WRITER'S DESK HEADER ================= */}
      {!isFocusMode && (
        <header className="relative z-20 flex items-center justify-between px-6 sm:px-14 py-5 border-b border-white/[0.06] bg-[#0a0908]/85 backdrop-blur-xl transition-opacity duration-300">
          {/* Left: Minimal Brand Mark */}
          <div className="flex items-center gap-2.5">
            <Feather size={14} className="text-[#D4A359]" />
            <span className="text-xs font-medium tracking-[0.22em] uppercase text-[#EAE5DF]/85">
              The Writer&apos;s Desk
            </span>
          </div>

          {/* Center: Clean Desk / Manuscript Switcher */}
          {!isGenerating && storyData && (
            <div className="flex items-center gap-8 text-xs tracking-[0.15em] uppercase">
              <button
                onClick={() => setActiveTab('creator')}
                className={`pb-1 transition-all cursor-pointer border-b ${
                  activeTab === 'creator'
                    ? 'text-[#EAE5DF] border-[#D4A359] font-medium'
                    : 'text-[#8C857B] border-transparent hover:text-[#EAE5DF]'
                }`}
              >
                New Manuscript
              </button>
              <button
                onClick={() => setActiveTab('reader')}
                className={`pb-1 transition-all cursor-pointer border-b ${
                  activeTab === 'reader'
                    ? 'text-[#EAE5DF] border-[#D4A359] font-medium'
                    : 'text-[#8C857B] border-transparent hover:text-[#EAE5DF]'
                }`}
              >
                Reading Room
              </button>
            </div>
          )}

          {/* Right: Focus Mode Toggle & Close */}
          <div className="flex items-center gap-3">
            {!isGenerating && activeTab === 'reader' && storyData && (
              <button
                onClick={() => setIsFocusMode(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-[#C7C0B6] hover:text-white transition cursor-pointer"
                title="Hide all UI elements except the unfolding story text (Shortcut: F)"
              >
                <Eye size={13} className="text-[#D4A359]" />
                <span>Focus Mode</span>
              </button>
            )}

            <button
              onClick={handleClose}
              className="p-2 text-[#8C857B] hover:text-[#EAE5DF] rounded-full hover:bg-white/[0.04] transition cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </header>
      )}

      {/* ================= 2. MAIN CENTERED MANUSCRIPT CANVAS ================= */}
      <main className="relative z-10 flex-1 overflow-y-auto px-6 sm:px-14 no-scrollbar">
        {errorMessage && !isFocusMode && (
          <div className="max-w-xl mx-auto mt-8 p-4 rounded-xl bg-red-950/30 border border-red-500/25 flex items-start gap-3 text-red-200 text-xs">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* =====================================================================
            STATE A: MINIMALIST LITERARY INK & SOUND PREPARATION
           ===================================================================== */}
        {isGenerating ? (
          <div className="max-w-xl mx-auto min-h-[72vh] flex flex-col items-center justify-center text-center py-16 space-y-10 animate-in fade-in duration-500">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg
                className="absolute inset-0 w-full h-full animate-vinyl"
                viewBox="0 0 140 140"
              >
                <circle
                  cx="70"
                  cy="70"
                  r="64"
                  fill="none"
                  stroke="rgba(212,163,89,0.4)"
                  strokeWidth="1"
                  strokeDasharray="90 50"
                />
              </svg>
              <svg
                className="absolute inset-3 w-[116px] h-[116px] animate-vinyl-reverse"
                viewBox="0 0 116 116"
              >
                <circle
                  cx="58"
                  cy="58"
                  r="52"
                  fill="none"
                  stroke="rgba(234,229,223,0.14)"
                  strokeWidth="1"
                  strokeDasharray="4 8"
                />
              </svg>
              <span className="text-xl font-editorial text-[#D4A359] tracking-widest">
                {progressPercent}%
              </span>
            </div>

            <div className="space-y-3 max-w-md">
              <h3 className="text-2xl sm:text-3xl font-editorial text-[#EAE5DF] font-normal tracking-wide">
                {storyData ? storyData.title : 'Composing the manuscript...'}
              </h3>
              <p className="text-sm sm:text-base text-[#8C857B] leading-relaxed font-editorial italic">
                {storyData?.synopsis
                  ? `“${storyData.synopsis}”`
                  : 'Weaving character subtext, spoken cadence, and acoustic atmosphere.'}
              </p>
            </div>

            <div className="flex items-end justify-center gap-1 h-5">
              {[0.3, 0.7, 0.5, 1, 0.6, 0.85, 0.4, 0.9, 0.5, 0.75, 0.35].map((h, i) => (
                <span
                  key={i}
                  className="w-[2px] bg-[#D4A359]/75 rounded-full animate-studio-wave"
                  style={{
                    height: `${Math.round(h * 100)}%`,
                    animationDelay: `${i * 0.09}s`,
                  }}
                />
              ))}
            </div>
          </div>
        ) : activeTab === 'creator' ? (
          /* =====================================================================
              STATE B: HIGH-END WRITER'S DESK COMPOSER (CENTERED, GENEROUS WHITESPACE)
             ===================================================================== */
          <div className="max-w-2xl mx-auto py-12 sm:py-16 space-y-12">
            {/* Centered Editorial Header */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl sm:text-5xl font-editorial font-normal text-[#F4EFE8] tracking-tight">
                What story shall unfold tonight?
              </h1>
              <p className="text-xs sm:text-sm text-[#8C857B] max-w-md mx-auto leading-relaxed">
                Write a brief premise or choose a real-world event from the archive.
              </p>
            </div>

            {/* Minimalist Two-Option Toggle: Original Fiction vs True Story */}
            <div className="flex items-center justify-center">
              <div className="inline-flex p-1 rounded-full bg-[#141210] border border-white/[0.07]">
                <button
                  onClick={() => {
                    setStoryMode('generate');
                    setCustomPrompt('');
                  }}
                  className={`px-5 py-2 rounded-full text-xs tracking-wide transition-all cursor-pointer ${
                    storyMode === 'generate'
                      ? 'bg-[#EAE5DF] text-[#0a0908] font-medium shadow-sm'
                      : 'text-[#8C857B] hover:text-[#EAE5DF]'
                  }`}
                >
                  Original Fiction
                </button>
                <button
                  onClick={() => {
                    setStoryMode('real');
                    setCustomPrompt('');
                  }}
                  className={`px-5 py-2 rounded-full text-xs tracking-wide transition-all cursor-pointer ${
                    storyMode === 'real'
                      ? 'bg-[#EAE5DF] text-[#0a0908] font-medium shadow-sm'
                      : 'text-[#8C857B] hover:text-[#EAE5DF]'
                  }`}
                >
                  True Story (Web Archive)
                </button>
              </div>
            </div>

            {/* Clean Writer's Manuscript Input Sheet */}
            <div className="space-y-4">
              <div className="relative rounded-2xl bg-[#12100e] border border-white/[0.08] focus-within:border-[#D4A359]/50 transition-colors p-6 sm:p-8 shadow-[0_24px_65px_rgba(0,0,0,0.65)]">
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={4}
                  placeholder={
                    storyMode === 'real'
                      ? 'Enter a real historical incident, biography, or true mystery (e.g., Dashrath Manjhi, Kuldhara village, Flight 73)...'
                      : 'Begin with a character, an unspoken secret, or a quiet setting...'
                  }
                  className="w-full bg-transparent text-lg sm:text-xl font-editorial text-[#F4EFE8] placeholder-[#8C857B]/50 outline-none resize-none leading-relaxed"
                />

                {/* Bottom Bar Inside Sheet: Language & Clear */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-2 border-t border-white/[0.05]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#8C857B] mr-1">Language:</span>
                    {STORY_LANGUAGES.map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => setStoryLanguage(lang.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] transition cursor-pointer ${
                          storyLanguage === lang.id
                            ? 'bg-white/[0.1] text-[#EAE5DF] font-medium'
                            : 'text-[#8C857B] hover:text-[#EAE5DF]'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>

                  {customPrompt && (
                    <button
                      onClick={() => setCustomPrompt('')}
                      className="text-[11px] text-[#8C857B] hover:text-[#EAE5DF] cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Subtle Literary Prompts */}
              <div className="space-y-2.5 pt-1">
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C857B]/75 block">
                  Story Seeds
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickSparks.map((spark, i) => (
                    <button
                      key={i}
                      onClick={() => setCustomPrompt(spark)}
                      className="text-left text-xs sm:text-sm font-editorial italic px-3.5 py-2 rounded-xl bg-[#12100e] hover:bg-white/[0.05] border border-white/[0.06] text-[#B8B0A4] hover:text-[#EAE5DF] transition cursor-pointer"
                    >
                      “{spark}”
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Minimalist Narrator & Acoustic Desk Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/[0.06]">
              {/* Narrator Selection */}
              <div className="space-y-3">
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C857B] flex items-center gap-2">
                  <Mic size={12} className="text-[#D4A359]" />
                  <span>Narrator Voice</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {NARRATOR_VOICES.map((v) => {
                    const active = selectedVoice === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setVoice(v.id)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          active
                            ? 'bg-[#181512] border-[#D4A359]/60 text-[#EAE5DF]'
                            : 'bg-[#110f0d] border-white/[0.05] text-[#8C857B] hover:text-[#EAE5DF]'
                        }`}
                      >
                        <div className="text-xs font-medium text-[#EAE5DF]">{v.persona}</div>
                        <div className="text-[10px] text-[#8C857B] mt-0.5 truncate">{v.tag}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Room Ambiance */}
              <div className="space-y-3 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C857B] flex items-center gap-2">
                    <CloudRain size={12} className="text-[#D4A359]" />
                    <span>Room Soundscape</span>
                  </span>
                  <button
                    onClick={() => setAmbientEnabled(!ambientEnabled)}
                    className="text-[11px] text-[#8C857B] hover:text-[#EAE5DF] cursor-pointer"
                  >
                    {ambientEnabled ? 'Active' : 'Silent'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setAmbientEnabled(true);
                      setAmbientType('rain');
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                      ambientEnabled && ambientType === 'rain'
                        ? 'bg-[#181512] border-[#D4A359]/60 text-[#EAE5DF]'
                        : 'bg-[#110f0d] border-white/[0.05] text-[#8C857B]'
                    }`}
                  >
                    <CloudRain size={14} />
                    <span className="text-xs">Soft Rain</span>
                  </button>
                  <button
                    onClick={() => {
                      setAmbientEnabled(true);
                      setAmbientType('waves');
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                      ambientEnabled && ambientType === 'waves'
                        ? 'bg-[#181512] border-[#D4A359]/60 text-[#EAE5DF]'
                        : 'bg-[#110f0d] border-white/[0.05] text-[#8C857B]'
                    }`}
                  >
                    <Waves size={14} />
                    <span className="text-xs">Night Waves</span>
                  </button>
                </div>

                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  disabled={!ambientEnabled}
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                  className="w-full accent-[#D4A359] h-1 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Begin Narration Action */}
            <div className="pt-2">
              <button
                onClick={handleGenerateAndPlay}
                className="w-full py-4 px-8 rounded-full bg-[#EAE5DF] hover:bg-white text-[#0a0908] font-medium text-sm tracking-wide transition-all flex items-center justify-center gap-3 cursor-pointer shadow-[0_12px_45px_rgba(234,229,223,0.14)] active:scale-[0.99]"
              >
                <span>Begin Narration</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Previous Manuscripts in Session */}
            {storyHistory.length > 0 && (
              <div className="pt-6 border-t border-white/[0.05] flex flex-wrap items-center justify-center gap-3">
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C857B]">
                  Recent:
                </span>
                {storyHistory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      loadHistoryStory(item);
                      setActiveTab('reader');
                    }}
                    className="text-xs sm:text-sm font-editorial italic text-[#B8B0A4] hover:text-[#EAE5DF] underline underline-offset-4 cursor-pointer"
                  >
                    {item.story.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* =====================================================================
              STATE C: CENTERED LITERARY MANUSCRIPT & FOCUS MODE READER
             ===================================================================== */
          <article
            className={`max-w-2xl mx-auto transition-all duration-500 ${
              isFocusMode ? 'py-20 sm:py-28' : 'py-12 sm:py-16 pb-40'
            }`}
          >
            {/* Literary Title & Epigraph */}
            <header className="text-center space-y-5 pb-12 mb-14 border-b border-white/[0.07]">
              <h1 className="text-3xl sm:text-5xl font-editorial font-normal text-[#F5F1EB] tracking-tight leading-tight hindi-serif">
                {storyData?.title}
              </h1>

              {storyData?.synopsis && (
                <p className="text-base sm:text-lg font-editorial italic text-[#9E968B] max-w-lg mx-auto leading-relaxed">
                  {storyData.synopsis}
                </p>
              )}

              {/* Subtle Web Archive Citations (Hidden in Focus Mode) */}
              {!isFocusMode && storyData?.sources?.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {storyData.sources.map((src, i) => (
                    <a
                      key={i}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#8C857B] hover:text-[#D4A359] transition"
                    >
                      <span className="truncate max-w-[180px]">{src.title}</span>
                      <ExternalLink size={10} />
                    </a>
                  ))}
                </div>
              )}
            </header>

            {/* Unfolding Story Text — Generous Whitespace, Roman Numerals & Drop Cap */}
            <div className="space-y-12 sm:space-y-14">
              {(storyData?.paragraphs || []).map((para, idx) => {
                const isActive = activeParagraphIndex === idx;
                const isPast = activeParagraphIndex > idx;

                return (
                  <div
                    key={`para-${idx}`}
                    ref={isActive ? activeParagraphRef : null}
                    onClick={() => playSceneAtIndex(idx)}
                    className="space-y-3 cursor-pointer group"
                  >
                    {/* Subtle Roman Numeral Scene Marker (Hidden in Focus Mode) */}
                    {!isFocusMode && (
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[11px] font-editorial tracking-[0.25em] transition-colors ${
                            isActive ? 'text-[#D4A359]' : 'text-[#8C857B]/45'
                          }`}
                        >
                          {ROMAN_NUMERALS[idx] || idx + 1}
                        </span>
                        {para.sceneNote && (
                          <>
                            <span className="text-white/15">·</span>
                            <span className="text-[11px] font-editorial italic text-[#8C857B]/65">
                              {para.sceneNote}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    <p
                      className={`text-xl sm:text-2xl leading-[2.05] hindi-serif transition-all duration-500 ${
                        idx === 0 && !isActive ? 'story-dropcap' : ''
                      } ${
                        isActive
                          ? 'text-[#F7F3EE]'
                          : isPast
                          ? 'text-[#8C857B]/55 group-hover:text-[#EAE5DF]/80'
                          : 'text-[#8C857B]/75 group-hover:text-[#EAE5DF]/90'
                      }`}
                    >
                      {isActive && isPlaying ? (
                        <span className="story-active-underline">{para.text}</span>
                      ) : (
                        para.text
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          </article>
        )}
      </main>

      {/* ================= 3. MINIMALIST FLOATING AUDIO BAR (HIDDEN IN FOCUS MODE) ================= */}
      {!isFocusMode && storyData && !isGenerating && (
        <div className="fixed bottom-0 inset-x-0 z-30 p-4 sm:p-6 bg-gradient-to-t from-[#0a0908] via-[#0a0908]/95 to-transparent pointer-events-none">
          <div className="max-w-xl mx-auto pointer-events-auto rounded-full bg-[#141210]/95 backdrop-blur-2xl border border-white/[0.08] px-5 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex items-center justify-between gap-4">
            {/* Transport Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => playSceneAtIndex(Math.max(0, activeParagraphIndex - 1))}
                disabled={activeParagraphIndex === 0}
                className="p-1.5 text-[#8C857B] hover:text-[#EAE5DF] disabled:opacity-25 transition cursor-pointer"
                title="Previous Paragraph"
              >
                <SkipBack size={15} />
              </button>

              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-[#EAE5DF] hover:bg-white text-[#0a0908] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause size={15} fill="currentColor" />
                ) : (
                  <Play size={15} fill="currentColor" className="ml-0.5" />
                )}
              </button>

              <button
                onClick={() =>
                  playSceneAtIndex(Math.min(totalScenes - 1, activeParagraphIndex + 1))
                }
                disabled={activeParagraphIndex >= totalScenes - 1}
                className="p-1.5 text-[#8C857B] hover:text-[#EAE5DF] disabled:opacity-25 transition cursor-pointer"
                title="Next Paragraph"
              >
                <SkipForward size={15} />
              </button>

              <button
                onClick={() => seekTo(Math.max(0, currentTime - 10))}
                className="p-1.5 text-[#8C857B] hover:text-[#EAE5DF] transition cursor-pointer"
                title="Rewind 10s"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* Scrubber & Paragraph Indicator */}
            <div className="flex-1 flex items-center gap-3">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="flex-1 accent-[#D4A359] h-1 bg-white/10 rounded-lg cursor-pointer"
              />
              <span className="text-[11px] font-mono-tabular text-[#8C857B]">
                {activeParagraphIndex + 1}/{totalScenes}
              </span>
            </div>

            {/* Subtle Volume & Rain Mix */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1.5" title="Voice Volume">
                <Volume2 size={13} className="text-[#8C857B]" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={voiceVolume}
                  onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
                  className="w-12 accent-[#EAE5DF] h-1 bg-white/10 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1.5" title="Room Soundscape">
                <CloudRain size={13} className="text-[#D4A359]" />
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                  className="w-12 accent-[#D4A359] h-1 bg-white/10 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
