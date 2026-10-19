import { useState, useEffect, useRef, useCallback } from 'react';
import { ambientAudio } from '../utils/ambientAudio';

// Tiny 44-byte silent WAV used to unlock HTMLAudioElement synchronously on user click
const SILENT_UNLOCK_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

export const QUICK_GENERATE_SPARKS = [
  'भानगढ़ के पास एक वीरान डाकबंगले में रात २ बजे चौकीदार को बंद कमरे से किसी अनजान साये की फुसफुसाहट, डरावनी हँसी और गुस्से भरी आवाज़ सुनाई देती है',
  'शिमला के एक बुज़ुर्ग घड़ीसाज़ को तीस साल पुरानी जेब-घड़ी के ढक्कन के पीछे एक अधूरा पता और सूखा देवदार का पत्ता मिलता है',
  'इलाहाबाद की पुश्तैनी हवेली बिकने से आख़िरी शाम पहले दो भाई आँगन के धुँधलके में पिताजी की बंद अलमारी की चाबी ढूँढते हैं',
  'रात दो बजे के रेडियो शो में एक अनजान बुज़ुर्ग कॉलर हर शुक्रवार को १९७४ की एक ही ग़ज़ल फरमाइश करता है',
  'दरियागंज के एक पुराने बरसाती कमरे की बंद दराज़ में मिली १९९९ की कैसेट दो भाइयों के बीच की बीस साल पुरानी ख़ामोशी तोड़ देती है',
];

export const QUICK_REAL_STORY_SPARKS = [
  'दशरथ मांझी की २२ साल तक अकेले पहाड़ का सीना चीरकर रास्ता बनाने की सच्ची दास्तान',
  'राजस्थान के कुलधरा गाँव का एक ही रात में अपनी दहलीज़ छोड़कर हमेशा के लिए वीरान हो जाने का रहस्य',
  'शिबुया स्टेशन की दहलीज़ पर ९ साल तक हर शाम अपने मालिक का इंतज़ार करने वाले हाचिको की कहानी',
  'फ्लाइट 73 में सैकड़ों मुसाफ़िरों की जान बचाने वाली नीरजा भनोट के हौसले और बलिदान की सच्ची कहानी',
  'अंतरिक्ष के सन्नाटे में ८७ घंटे तक ज़िंदगी की जंग लड़ने वाले अपोलो १३ के यात्रियों की सच्ची घटना',
];

export const STORY_LANGUAGES = [
  { id: 'hindi', label: 'Hindi (अदबी हिंदी)', desc: 'Evocative Hindustani & Hindi prose' },
  { id: 'hinglish', label: 'Hinglish', desc: 'Literary Hindustani-English blend' },
  { id: 'english', label: 'English', desc: 'Contemporary literary fiction' },
];

export const NARRATOR_VOICES = [
  {
    id: 'Kore',
    name: 'Kore',
    persona: 'Kavya',
    gender: 'female',
    tag: 'Soulful & Intimate',
    desc: 'Warm, empathetic delivery with delicate pauses',
    pitch: 1.04,
    rate: 0.94,
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    persona: 'Kabir',
    gender: 'male',
    tag: 'Deep & Resonant',
    desc: 'Late-night baritone with calm narrative authority',
    pitch: 0.88,
    rate: 0.92,
  },
  {
    id: 'Puck',
    name: 'Puck',
    persona: 'Aarav',
    gender: 'male',
    tag: 'Expressive & Dynamic',
    desc: 'Nuanced dialogue pacing and vivid emotional range',
    pitch: 0.96,
    rate: 0.96,
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    persona: 'Meher',
    gender: 'female',
    tag: 'Velvet & Calm',
    desc: 'Soft, nocturnal acoustic storytelling tone',
    pitch: 1.08,
    rate: 0.91,
  },
];

export const LEVEL5_PROCESS_TELEMETRY = [
  'Initializing Literary Novelist persona & character psychology...',
  'Structuring 5-act dramatic pacing, subtext & micro-gestures...',
  'Weaving evocative Hindustani/Hinglish literary vocabulary...',
  'Scoring vocal breath, sigh & caesura cues for Gemini 3.8 TTS...',
  'Calibrating room acoustics & synchronized manuscript teleprompter...',
];

function base64ToBlobUrl(base64) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

export function useStoryStudio({ onAudioStarted, onAudioStopped }) {
  const [storyMode, setStoryMode] = useState('generate'); // 'generate' | 'real'
  const [storyLanguage, setStoryLanguage] = useState('hindi'); // 'hindi' | 'hinglish' | 'english'
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [voiceGender, setVoiceGender] = useState('female');

  // Generation & Progressive Buffering States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(''); // 'searching' | 'writing' | 'synthesizing_first' | ''
  const [progressPercent, setProgressPercent] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [telemetryIndex, setTelemetryIndex] = useState(0);
  const [storyData, setStoryData] = useState(null);
  const [storyHistory, setStoryHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  // Scene-by-Scene Progressive Audio Streaming State
  const [bufferedScenes, setBufferedScenes] = useState({});
  const [isBufferingBackground, setIsBufferingBackground] = useState(false);
  const [loadingSceneIndex, setLoadingSceneIndex] = useState(null);
  const [usingQuotaSafeVoice, setUsingQuotaSafeVoice] = useState(false);

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [voiceVolume, setVoiceVolume] = useState(0.95);
  const [activeParagraphIndex, setActiveParagraphIndex] = useState(0);

  // Ambient Layer
  const [ambientEnabled, setAmbientEnabled] = useState(true);
  const [ambientVolume, setAmbientVolumeState] = useState(0.24);
  const [ambientType, setAmbientType] = useState('rain');

  const audioElementRef = useRef(null);
  const sceneAudioUrlsRef = useRef({});
  const scenePromisesRef = useRef({});
  const activeParaRef = useRef(0);
  const storyDataRef = useRef(null);
  const runIdRef = useRef(0);
  const speechTimerRef = useRef(null);

  // Stable refs for callbacks so Audio element is NEVER destroyed on re-renders
  const onAudioStartedRef = useRef(onAudioStarted);
  const onAudioStoppedRef = useRef(onAudioStopped);
  const playSceneAtIndexRef = useRef(null);

  useEffect(() => {
    onAudioStartedRef.current = onAudioStarted;
    onAudioStoppedRef.current = onAudioStopped;
  }, [onAudioStarted, onAudioStopped]);

  useEffect(() => {
    activeParaRef.current = activeParagraphIndex;
  }, [activeParagraphIndex]);

  useEffect(() => {
    storyDataRef.current = storyData;
  }, [storyData]);

  // Smooth progress & telemetry timer during initial generation
  useEffect(() => {
    if (!isGenerating) {
      setElapsedSeconds(0);
      setTelemetryIndex(0);
      return;
    }

    const secTimer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const progressTimer = setInterval(() => {
      setProgressPercent((prev) => {
        if (generationStep === 'searching' || generationStep === 'writing') {
          return prev < 58 ? prev + 3 : prev;
        }
        if (generationStep === 'synthesizing_first') {
          return prev < 95 ? prev + 4 : prev;
        }
        return prev;
      });
    }, 260);

    const telemetryTimer = setInterval(() => {
      setTelemetryIndex((prev) => (prev + 1) % LEVEL5_PROCESS_TELEMETRY.length);
    }, 2200);

    return () => {
      clearInterval(secTimer);
      clearInterval(progressTimer);
      clearInterval(telemetryTimer);
    };
  }, [isGenerating, generationStep]);

  const stopBrowserSpeech = useCallback(() => {
    if (speechTimerRef.current) {
      clearInterval(speechTimerRef.current);
      speechTimerRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Synthesize a single scene's audio via /api/story/narrate (Gemini 3.8 Flash TTS)
  const synthesizeSceneAudio = useCallback(
    async (sceneIdx, paragraph, voiceId, currentRunId) => {
      if (sceneAudioUrlsRef.current[sceneIdx]) {
        return sceneAudioUrlsRef.current[sceneIdx];
      }
      if (scenePromisesRef.current[sceneIdx]) {
        return scenePromisesRef.current[sceneIdx];
      }

      const scriptText = paragraph.spokenScript || paragraph.text;
      const promise = (async () => {
        try {
          const res = await fetch('/api/story/narrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              script: scriptText,
              voice: voiceId,
              vocalDirection: paragraph.vocalDirection || '',
            }),
          });

          if (!res.ok) {
            throw new Error('Quota fallback');
          }

          const data = await res.json();
          if (data.useBrowserNeuralTts || !data.audioBase64) {
            if (runIdRef.current === currentRunId) {
              setUsingQuotaSafeVoice(true);
              sceneAudioUrlsRef.current[sceneIdx] = 'BROWSER_TTS';
              setBufferedScenes((prev) => ({ ...prev, [sceneIdx]: 'BROWSER_TTS' }));
            }
            return 'BROWSER_TTS';
          }

          const blobUrl = base64ToBlobUrl(data.audioBase64);
          if (runIdRef.current === currentRunId) {
            sceneAudioUrlsRef.current[sceneIdx] = blobUrl;
            setBufferedScenes((prev) => ({ ...prev, [sceneIdx]: blobUrl }));
          }
          return blobUrl;
        } catch {
          if (runIdRef.current === currentRunId) {
            setUsingQuotaSafeVoice(true);
            sceneAudioUrlsRef.current[sceneIdx] = 'BROWSER_TTS';
            setBufferedScenes((prev) => ({ ...prev, [sceneIdx]: 'BROWSER_TTS' }));
          }
          return 'BROWSER_TTS';
        }
      })();

      scenePromisesRef.current[sceneIdx] = promise;
      try {
        return await promise;
      } finally {
        delete scenePromisesRef.current[sceneIdx];
      }
    },
    []
  );

  // Play a specific scene index
  const playSceneAtIndex = useCallback(
    async (sceneIdx) => {
      const currentStory = storyDataRef.current;
      if (!currentStory?.paragraphs?.[sceneIdx]) return;

      const currentRunId = runIdRef.current;
      stopBrowserSpeech();
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }

      setActiveParagraphIndex(sceneIdx);
      activeParaRef.current = sceneIdx;

      try {
        let urlOrMode = sceneAudioUrlsRef.current[sceneIdx];
        if (!urlOrMode) {
          setLoadingSceneIndex(sceneIdx);
          urlOrMode = await synthesizeSceneAudio(
            sceneIdx,
            currentStory.paragraphs[sceneIdx],
            selectedVoice,
            currentRunId
          );
          setLoadingSceneIndex(null);
        }

        if (runIdRef.current !== currentRunId) return;

        // Pre-fetch next scene in background while current scene plays
        if (currentStory.paragraphs[sceneIdx + 1] && !sceneAudioUrlsRef.current[sceneIdx + 1]) {
          setIsBufferingBackground(true);
          synthesizeSceneAudio(
            sceneIdx + 1,
            currentStory.paragraphs[sceneIdx + 1],
            selectedVoice,
            currentRunId
          ).finally(() => {
            if (runIdRef.current === currentRunId) {
              setIsBufferingBackground(false);
            }
          });
        }

        // Mode A: Gemini Neural TTS WAV Stream
        if (audioElementRef.current && urlOrMode && urlOrMode !== 'BROWSER_TTS') {
          const audio = audioElementRef.current;
          audio.src = urlOrMode;
          audio.volume = voiceVolume;
          audio.currentTime = 0;
          try {
            await audio.play();
            setIsPlaying(true);
            return;
          } catch (playErr) {
            console.warn('Audio play notice, falling back if blocked:', playErr.message);
          }
        }

        // Mode B: Zero-Quota Browser Neural Voice Fallback
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const cleanText = (currentStory.paragraphs[sceneIdx].text || '').trim();
          const estimatedSecs = Math.max(8, Math.round(cleanText.split(/\s+/).length * 0.45));
          setDuration(estimatedSecs);
          setCurrentTime(0);
          setIsPlaying(true);

          const utterance = new SpeechSynthesisUtterance(cleanText);
          const voiceMeta =
            NARRATOR_VOICES.find((v) => v.id === selectedVoice) || NARRATOR_VOICES[0];
          utterance.pitch = voiceMeta.pitch || 1;
          utterance.rate = voiceMeta.rate || 0.94;
          utterance.volume = voiceVolume;

          const voices = window.speechSynthesis.getVoices();
          const isDevanagari = /[\u0900-\u097F]/.test(cleanText);
          const preferredVoice = voices.find((v) =>
            isDevanagari
              ? v.lang.includes('hi') || v.name.toLowerCase().includes('hindi')
              : v.lang.includes('en-IN') || v.lang.includes('en-US')
          );
          if (preferredVoice) utterance.voice = preferredVoice;
          utterance.lang = isDevanagari ? 'hi-IN' : 'en-IN';

          const startedAt = Date.now();
          speechTimerRef.current = setInterval(() => {
            const elapsed = (Date.now() - startedAt) / 1000;
            setCurrentTime(Math.min(estimatedSecs, elapsed));
          }, 200);

          utterance.onend = () => {
            if (speechTimerRef.current) clearInterval(speechTimerRef.current);
            if (runIdRef.current !== currentRunId) return;
            const totalScenes = storyDataRef.current?.paragraphs?.length || 0;
            if (sceneIdx + 1 < totalScenes) {
              if (playSceneAtIndexRef.current) {
                playSceneAtIndexRef.current(sceneIdx + 1);
              }
            } else {
              setIsPlaying(false);
              setCurrentTime(0);
              setActiveParagraphIndex(0);
              ambientAudio.stop();
              if (onAudioStoppedRef.current) onAudioStoppedRef.current();
            }
          };

          window.speechSynthesis.speak(utterance);
        }
      } catch (err) {
        console.error(`Failed to play scene ${sceneIdx + 1}:`, err);
        setLoadingSceneIndex(null);
      }
    },
    [selectedVoice, voiceVolume, stopBrowserSpeech, synthesizeSceneAudio]
  );

  useEffect(() => {
    playSceneAtIndexRef.current = playSceneAtIndex;
  }, [playSceneAtIndex]);

  // Initialize HTML5 Audio Element ONCE on mount (never destroyed on re-render!)
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioElementRef.current = audio;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      const currentStory = storyDataRef.current;
      const totalScenes = currentStory?.paragraphs?.length || 0;
      const nextSceneIdx = activeParaRef.current + 1;

      if (nextSceneIdx < totalScenes) {
        if (playSceneAtIndexRef.current) {
          playSceneAtIndexRef.current(nextSceneIdx);
        }
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
        setActiveParagraphIndex(0);
        ambientAudio.stop();
        if (onAudioStoppedRef.current) onAudioStoppedRef.current();
      }
    };
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Update voice volume
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.volume = voiceVolume;
    }
  }, [voiceVolume]);

  // Update ambient volume
  useEffect(() => {
    ambientAudio.setVolume(ambientVolume);
  }, [ambientVolume]);

  // Ambient sound synchronization
  useEffect(() => {
    if ((isPlaying || isGenerating) && ambientEnabled) {
      ambientAudio.start(ambientType);
      ambientAudio.setVolume(isGenerating ? ambientVolume * 0.6 : ambientVolume);
    } else {
      ambientAudio.stop();
    }
  }, [isPlaying, isGenerating, ambientEnabled, ambientType, ambientVolume]);

  const setVoice = (voiceId) => {
    setSelectedVoice(voiceId);
    const v = NARRATOR_VOICES.find((item) => item.id === voiceId);
    if (v) setVoiceGender(v.gender);
  };

  /**
   * Progressive Generation & Instant Scene 1 Playback (Gemini 3.8 Flash + Gemini 3.8 Flash TTS)
   */
  const handleGenerateAndPlay = useCallback(async () => {
    const currentRunId = ++runIdRef.current;
    stopBrowserSpeech();

    // Unlock HTMLAudioElement synchronously inside user click gesture!
    if (audioElementRef.current) {
      try {
        audioElementRef.current.src = SILENT_UNLOCK_WAV;
        audioElementRef.current
          .play()
          .then(() => {
            if (audioElementRef.current && audioElementRef.current.src === SILENT_UNLOCK_WAV) {
              audioElementRef.current.pause();
            }
          })
          .catch(() => {});
      } catch {}
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setUsingQuotaSafeVoice(false);
    setProgressPercent(12);
    setGenerationStep(storyMode === 'real' ? 'searching' : 'writing');

    sceneAudioUrlsRef.current = {};
    scenePromisesRef.current = {};
    setBufferedScenes({});
    setIsBufferingBackground(false);
    setActiveParagraphIndex(0);
    activeParaRef.current = 0;

    if (onAudioStartedRef.current) {
      onAudioStartedRef.current();
    }

    try {
      const previousTitles = [
        storyDataRef.current?.title,
        ...storyHistory.map((h) => h.story?.title),
      ].filter(Boolean);

      // STEP 1: Generate Story or Search Web
      const storyRes = await fetch('/api/story/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyMode,
          mood: storyMode === 'real' ? 'Real Web Story' : 'SoulWriter Original',
          prompt: customPrompt.trim(),
          voiceGender,
          storyLanguage,
          excludeTitles: previousTitles,
        }),
      });

      if (!storyRes.ok) {
        const errJson = await storyRes.json().catch(() => ({}));
        throw new Error(errJson.error || `Story generation failed (${storyRes.status})`);
      }

      const generatedStory = await storyRes.json();
      if (runIdRef.current !== currentRunId) return;

      const paragraphs = generatedStory.paragraphs || [];
      if (paragraphs.length === 0) {
        throw new Error('Generated story had no scenes.');
      }

      setStoryData(generatedStory);
      storyDataRef.current = generatedStory;
      setProgressPercent(68);

      // STEP 2: Synthesize Scene 1 via Gemini 3.8 Flash TTS for instant playback
      setGenerationStep('synthesizing_first');

      await synthesizeSceneAudio(0, paragraphs[0], selectedVoice, currentRunId);

      if (runIdRef.current !== currentRunId) return;
      setProgressPercent(100);

      // Exit loading screen and start playing Scene 1 immediately!
      setIsGenerating(false);
      setGenerationStep('');
      await playSceneAtIndex(0);

      // Save to session history
      const voiceObj =
        NARRATOR_VOICES.find((v) => v.id === selectedVoice) || NARRATOR_VOICES[0];
      setStoryHistory((prev) => [
        {
          id: Date.now(),
          story: generatedStory,
          sceneUrls: sceneAudioUrlsRef.current,
          voiceId: selectedVoice,
          voicePersona: voiceObj.persona,
          storyMode,
        },
        ...prev.slice(0, 5),
      ]);

      // Next scenes are pre-fetched automatically via 1-scene lookahead during playback to conserve daily TTS quota
    } catch (err) {
      console.error('Story studio execution failed:', err);
      if (runIdRef.current === currentRunId) {
        setErrorMessage(err.message || 'An error occurred while preparing your story.');
        setIsGenerating(false);
        setGenerationStep('');
        if (onAudioStoppedRef.current) onAudioStoppedRef.current();
      }
    }
  }, [
    storyMode,
    storyLanguage,
    customPrompt,
    voiceGender,
    selectedVoice,
    stopBrowserSpeech,
    synthesizeSceneAudio,
    playSceneAtIndex,
  ]);

  const loadHistoryStory = useCallback(
    async (item) => {
      if (!item) return;
      runIdRef.current++;
      stopBrowserSpeech();
      setStoryData(item.story);
      storyDataRef.current = item.story;
      sceneAudioUrlsRef.current = { ...(item.sceneUrls || {}) };
      setBufferedScenes({ ...(item.sceneUrls || {}) });
      setSelectedVoice(item.voiceId);
      setActiveParagraphIndex(0);
      activeParaRef.current = 0;

      if (onAudioStartedRef.current) onAudioStartedRef.current();
      playSceneAtIndex(0);
    },
    [playSceneAtIndex, stopBrowserSpeech]
  );

  const togglePlay = useCallback(() => {
    const currentMode = sceneAudioUrlsRef.current[activeParaRef.current];
    if (
      currentMode === 'BROWSER_TTS' &&
      typeof window !== 'undefined' &&
      'speechSynthesis' in window
    ) {
      if (isPlaying) {
        window.speechSynthesis.pause();
        setIsPlaying(false);
      } else {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setIsPlaying(true);
        } else {
          playSceneAtIndex(activeParaRef.current);
        }
      }
      return;
    }

    if (!audioElementRef.current || !audioElementRef.current.src) {
      playSceneAtIndex(activeParaRef.current);
      return;
    }
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  }, [isPlaying, playSceneAtIndex]);

  const seekTo = useCallback((seconds) => {
    if (
      !audioElementRef.current ||
      sceneAudioUrlsRef.current[activeParaRef.current] === 'BROWSER_TTS'
    ) {
      return;
    }
    audioElementRef.current.currentTime = seconds;
    setCurrentTime(seconds);
  }, []);

  const stopAll = useCallback(() => {
    runIdRef.current++;
    stopBrowserSpeech();
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
    setIsBufferingBackground(false);
    ambientAudio.stop();
    setIsPlaying(false);
    if (onAudioStoppedRef.current) onAudioStoppedRef.current();
  }, [stopBrowserSpeech]);

  return {
    storyMode,
    setStoryMode,
    storyLanguage,
    setStoryLanguage,
    customPrompt,
    setCustomPrompt,
    selectedVoice,
    setVoice,
    isGenerating,
    generationStep,
    progressPercent,
    elapsedSeconds,
    currentTelemetry: LEVEL5_PROCESS_TELEMETRY[telemetryIndex],
    storyData,
    storyHistory,
    loadHistoryStory,
    bufferedScenes,
    isBufferingBackground,
    loadingSceneIndex,
    usingQuotaSafeVoice,
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
    setAmbientVolume: setAmbientVolumeState,
    ambientType,
    setAmbientType,
    activeParagraphIndex,
    handleGenerateAndPlay,
    togglePlay,
    seekTo,
    stopAll,
  };
}
