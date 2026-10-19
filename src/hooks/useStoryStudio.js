import { useState, useEffect, useRef, useCallback } from 'react';
import { ambientAudio } from '../utils/ambientAudio';

export const QUICK_GENERATE_SPARKS = [
  'An aging watchmaker in Shimla finds a 30-year-old unmailed letter hidden inside a broken pocket watch',
  'A late-night radio host receives an anonymous call from someone who remembers a childhood promise',
  'Two estranged brothers meet at their ancestral house on the night before it is sold forever',
  'A passenger on the last winter express realizes the stranger opposite them is carrying their old diary',
  'In a quiet apartment, a voice recording on an old cassette tape reveals what really happened that summer',
];

export const QUICK_REAL_STORY_SPARKS = [
  'Dashrath Manjhi carving a road through a mountain over 22 years alone',
  'The overnight vanishing of Kuldhara village in Rajasthan',
  'Hachiko waiting every evening for 9 years at Shibuya station',
  'Apollo 13 astronauts surviving 87 hours in the dark of space',
  'Neerja Bhanot saving hundreds of lives aboard Flight 73',
];

export const STORY_LANGUAGES = [
  { id: 'hindi', label: 'Hindi', desc: 'Natural spoken Hindi' },
  { id: 'hinglish', label: 'Hinglish', desc: 'Conversational Hindi-English' },
  { id: 'english', label: 'English', desc: 'Cinematic English prose' },
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
  'Initializing SoulWriter psychological subtext engine...',
  'Mapping character motivations, hesitations, and sensory cues...',
  'Structuring multi-scene narrative arc with vocal emotion markers...',
  'Synthesizing Part 1 neural voice stream for instant playback...',
  'Calibrating acoustic breath, sigh, and room ambiance layers...',
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
  // Each entry in bufferedScenes is either a blobUrl string OR 'BROWSER_TTS'
  const [bufferedScenes, setBufferedScenes] = useState({});
  const [isBufferingBackground, setIsBufferingBackground] = useState(false);
  const [loadingSceneIndex, setLoadingSceneIndex] = useState(null);
  const [usingQuotaSafeVoice, setUsingQuotaSafeVoice] = useState(false);

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [voiceVolume, setVoiceVolume] = useState(0.92);
  const [activeParagraphIndex, setActiveParagraphIndex] = useState(0);

  // Ambient Layer
  const [ambientEnabled, setAmbientEnabled] = useState(true);
  const [ambientVolume, setAmbientVolumeState] = useState(0.26);
  const [ambientType, setAmbientType] = useState('rain');

  const audioElementRef = useRef(null);
  const sceneAudioUrlsRef = useRef({});
  const scenePromisesRef = useRef({});
  const activeParaRef = useRef(0);
  const storyDataRef = useRef(null);
  const runIdRef = useRef(0);
  const speechTimerRef = useRef(null);

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
          return prev < 94 ? prev + 4 : prev;
        }
        return prev;
      });
    }, 280);

    const telemetryTimer = setInterval(() => {
      setTelemetryIndex((prev) => (prev + 1) % LEVEL5_PROCESS_TELEMETRY.length);
    }, 2500);

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

  // Synthesize a single scene's audio (returns blobUrl or 'BROWSER_TTS' if quota reached)
  const synthesizeSceneAudio = useCallback(async (sceneIdx, paragraph, voiceId, currentRunId) => {
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
  }, []);

  // Play a specific scene index (supports both Cloud WAV and Zero-Quota Browser Neural Speech)
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

        // Mode B: Zero-Quota Browser Neural Voice Engine
        if (urlOrMode === 'BROWSER_TTS' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const cleanText = (currentStory.paragraphs[sceneIdx].text || '').trim();
          const estimatedSecs = Math.max(8, Math.round(cleanText.split(/\s+/).length * 0.45));
          setDuration(estimatedSecs);
          setCurrentTime(0);
          setIsPlaying(true);

          const utterance = new SpeechSynthesisUtterance(cleanText);
          const voiceMeta = NARRATOR_VOICES.find((v) => v.id === selectedVoice) || NARRATOR_VOICES[0];
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
              playSceneAtIndex(sceneIdx + 1);
            } else {
              setIsPlaying(false);
              setCurrentTime(0);
              setActiveParagraphIndex(0);
              ambientAudio.stop();
              if (onAudioStopped) onAudioStopped();
            }
          };

          window.speechSynthesis.speak(utterance);
          return;
        }

        // Mode A: Cloud WAV Audio Stream
        if (audioElementRef.current && urlOrMode && urlOrMode !== 'BROWSER_TTS') {
          audioElementRef.current.src = urlOrMode;
          audioElementRef.current.currentTime = 0;
          audioElementRef.current.load();
          await audioElementRef.current.play();
          setIsPlaying(true);
        }
      } catch (err) {
        console.error(`Failed to play scene ${sceneIdx + 1}:`, err);
        setLoadingSceneIndex(null);
      }
    },
    [selectedVoice, voiceVolume, onAudioStopped, stopBrowserSpeech, synthesizeSceneAudio]
  );

  // Initialize HTML5 Audio Element & auto-advance to next scene
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
        playSceneAtIndex(nextSceneIdx);
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
        setActiveParagraphIndex(0);
        ambientAudio.stop();
        if (onAudioStopped) onAudioStopped();
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
      stopBrowserSpeech();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.pause();
      audio.src = '';
    };
  }, [onAudioStopped, playSceneAtIndex, stopBrowserSpeech]);

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
   * Quota-Safe Progressive Generation & Instant First-Minute Playback:
   * - Synthesizes Scene 1 immediately.
   * - Spaces out background scene pre-fetching by 4.5s per scene so RPM limits are never burst!
   */
  const handleGenerateAndPlay = useCallback(async () => {
    const currentRunId = ++runIdRef.current;
    stopBrowserSpeech();
    setIsGenerating(true);
    setErrorMessage(null);
    setUsingQuotaSafeVoice(false);
    setProgressPercent(10);
    setGenerationStep(storyMode === 'real' ? 'searching' : 'writing');

    sceneAudioUrlsRef.current = {};
    scenePromisesRef.current = {};
    setBufferedScenes({});
    setIsBufferingBackground(false);
    setActiveParagraphIndex(0);
    activeParaRef.current = 0;

    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    if (onAudioStarted) {
      onAudioStarted();
    }

    try {
      const defaultPrompt =
        storyMode === 'real' ? QUICK_REAL_STORY_SPARKS[0] : QUICK_GENERATE_SPARKS[0];
      const activePrompt = customPrompt.trim() || defaultPrompt;

      // STEP 1: Generate Story or Search Web
      const storyRes = await fetch('/api/story/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyMode,
          mood: storyMode === 'real' ? 'Real Web Story' : 'SoulWriter Original',
          prompt: activePrompt,
          voiceGender,
          storyLanguage,
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
      setProgressPercent(65);

      // STEP 2: Synthesize Scene 1 (First ~1 minute) for instant playback!
      setGenerationStep('synthesizing_first');

      await synthesizeSceneAudio(0, paragraphs[0], selectedVoice, currentRunId);

      if (runIdRef.current !== currentRunId) return;
      setProgressPercent(100);

      // Exit loading screen and start playing Scene 1 right away!
      setIsGenerating(false);
      setGenerationStep('');
      playSceneAtIndex(0);

      // Save to session history
      const voiceObj = NARRATOR_VOICES.find((v) => v.id === selectedVoice) || NARRATOR_VOICES[0];
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

      // STEP 3: Rate-Limit-Safe Background Pre-Fetching (4.5s spacing between scenes to protect RPM quota!)
      if (paragraphs.length > 1) {
        setIsBufferingBackground(true);
        (async () => {
          for (let i = 1; i < paragraphs.length; i++) {
            if (runIdRef.current !== currentRunId) break;
            // Wait 4.2s before fetching the next scene in background to avoid 429 RPM bursts
            await new Promise((r) => setTimeout(r, 4200));
            if (runIdRef.current !== currentRunId) break;
            try {
              await synthesizeSceneAudio(i, paragraphs[i], selectedVoice, currentRunId);
            } catch {}
          }
          if (runIdRef.current === currentRunId) {
            setIsBufferingBackground(false);
          }
        })();
      }
    } catch (err) {
      console.error('Story studio execution failed:', err);
      if (runIdRef.current === currentRunId) {
        setErrorMessage(err.message || 'An error occurred while preparing your story.');
        setIsGenerating(false);
        setGenerationStep('');
        if (onAudioStopped) onAudioStopped();
      }
    }
  }, [
    storyMode,
    storyLanguage,
    customPrompt,
    voiceGender,
    selectedVoice,
    onAudioStarted,
    onAudioStopped,
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

      if (onAudioStarted) onAudioStarted();
      playSceneAtIndex(0);
    },
    [onAudioStarted, playSceneAtIndex, stopBrowserSpeech]
  );

  const togglePlay = useCallback(() => {
    const currentMode = sceneAudioUrlsRef.current[activeParaRef.current];
    if (currentMode === 'BROWSER_TTS' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
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

    if (!audioElementRef.current || !audioElementRef.current.src) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isPlaying, playSceneAtIndex]);

  const seekTo = useCallback((seconds) => {
    if (!audioElementRef.current || sceneAudioUrlsRef.current[activeParaRef.current] === 'BROWSER_TTS') {
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
    if (onAudioStopped) onAudioStopped();
  }, [onAudioStopped, stopBrowserSpeech]);

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
