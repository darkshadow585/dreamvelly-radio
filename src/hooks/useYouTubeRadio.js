import { useState, useEffect, useRef, useCallback } from 'react';

// 48-byte valid silent WAV audio data URI to activate mobile audio session keep-alive
const SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

export function useYouTubeRadio({
  currentSongId,
  currentSong,
  onSongEnd,
  onNext,
  onPrev,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(80);
  const [isMuted, setIsMuted] = useState(false);

  const playerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const currentSongIdRef = useRef(currentSongId || currentSong?.id);
  currentSongIdRef.current = currentSongId || currentSong?.id;

  const userIntentPlayingRef = useRef(false);
  const wakeLockRef = useRef(null);
  const keepAliveAudioRef = useRef(null);

  // Initialize background audio keep-alive element for mobile devices
  useEffect(() => {
    try {
      const audio = new Audio();
      audio.src = SILENT_AUDIO_URI;
      audio.loop = true;
      audio.volume = 0.001;
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      keepAliveAudioRef.current = audio;
    } catch (e) {
      console.warn('Audio keep-alive initialization skipped:', e);
    }

    return () => {
      if (keepAliveAudioRef.current) {
        keepAliveAudioRef.current.pause();
        keepAliveAudioRef.current = null;
      }
    };
  }, []);

  // Sync background audio keep-alive with playback state
  useEffect(() => {
    const audio = keepAliveAudioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Screen Wake Lock API (prevents mobile / laptop screen from auto-dimming when playing)
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isPlaying && !wakeLockRef.current) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          wakeLockRef.current.addEventListener('release', () => {
            wakeLockRef.current = null;
          });
        } catch (err) {
          // Ignored if battery saver or tab hidden
        }
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
        } catch (e) {}
        wakeLockRef.current = null;
      }
    };

    if (isPlaying) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [isPlaying]);

  // Initialize YouTube API and Player
  useEffect(() => {
    let playerInstance = null;

    const setupPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (playerRef.current) return;

      playerInstance = new window.YT.Player('hidden-yt-player', {
        height: '180',
        width: '320',
        videoId: currentSongIdRef.current || 'cE4atl_v-Z0',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          iv_load_policy: 3,
        },
        events: {
          onReady: (event) => {
            playerRef.current = event.target;
            setIsReady(true);
            event.target.setVolume(80);
            if (userIntentPlayingRef.current) {
              event.target.playVideo();
            }
          },
          onStateChange: (event) => {
            // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              userIntentPlayingRef.current = true;
              setIsBuffering(false);
              const dur = event.target.getDuration();
              if (dur) setDuration(dur);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              // If browser or screen lock pauses without user intent, auto resume
              if (userIntentPlayingRef.current && document.visibilityState === 'hidden') {
                setTimeout(() => {
                  if (userIntentPlayingRef.current && playerRef.current) {
                    playerRef.current.playVideo();
                  }
                }, 150);
              } else {
                setIsPlaying(false);
                setIsBuffering(false);
              }
            } else if (event.data === window.YT.PlayerState.BUFFERING) {
              setIsBuffering(true);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              setIsBuffering(false);
              if (onSongEnd) onSongEnd();
            }
          },
          onError: (err) => {
            console.warn('YouTube Player error code:', err.data, '- Skipping to next track');
            setIsBuffering(false);
            if (onSongEnd) onSongEnd();
          },
        },
      });
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      window.onYouTubeIframeAPIReady = setupPlayer;
      document.body.appendChild(tag);
    } else {
      setupPlayer();
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Update current playback time
  useEffect(() => {
    if (isPlaying) {
      progressIntervalRef.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const curr = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          if (curr !== undefined) setCurrentTime(curr);
          if (dur) setDuration(dur);
        }
      }, 500);
    } else {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying]);

  // Handle track changes
  const activeId = currentSongId || currentSong?.id;
  useEffect(() => {
    if (!isReady || !playerRef.current || !activeId) return;

    try {
      if (typeof playerRef.current.loadVideoById === 'function') {
        playerRef.current.loadVideoById(activeId);
        setCurrentTime(0);
        if (userIntentPlayingRef.current) {
          playerRef.current.playVideo();
        }
      }
    } catch (e) {
      console.error('Failed to switch video:', e);
    }
  }, [activeId, isReady]);

  // MediaSession API: Mobile Lock Screen Widget, Notification Bar & Bluetooth Controls
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const track = currentSong;
    if (track) {
      const artworkSrc = track.cover?.startsWith('http')
        ? track.cover
        : `${window.location.origin}${track.cover || '/dreamevelly_bg.jpg'}`;

      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: track.title || 'DREAMVALLEY Track',
        artist: track.artist || 'KS Music Lounge',
        album: track.movie ? `${track.movie} • DREAMVALLEY Radio` : 'DREAMVALLEY Radio',
        artwork: [
          { src: artworkSrc, sizes: '96x96', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '128x128', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '192x192', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '256x256', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '512x512', type: 'image/jpeg' },
        ],
      });
    }

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    const actionHandlers = [
      ['play', () => {
        userIntentPlayingRef.current = true;
        if (playerRef.current) playerRef.current.playVideo();
        setIsPlaying(true);
      }],
      ['pause', () => {
        userIntentPlayingRef.current = false;
        if (playerRef.current) playerRef.current.pauseVideo();
        setIsPlaying(false);
      }],
      ['previoustrack', () => { if (onPrev) onPrev(); }],
      ['nexttrack', () => { if (onNext) onNext(); }],
      ['seekto', (details) => {
        if (details.seekTime !== undefined && playerRef.current) {
          playerRef.current.seekTo(details.seekTime, true);
          setCurrentTime(details.seekTime);
        }
      }],
      ['seekbackward', (details) => {
        const offset = details.seekOffset || 10;
        const newTime = Math.max(0, currentTime - offset);
        if (playerRef.current) playerRef.current.seekTo(newTime, true);
        setCurrentTime(newTime);
      }],
      ['seekforward', (details) => {
        const offset = details.seekOffset || 10;
        const newTime = Math.min(duration, currentTime + offset);
        if (playerRef.current) playerRef.current.seekTo(newTime, true);
        setCurrentTime(newTime);
      }],
    ];

    actionHandlers.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (e) {}
    });

    // Update playback position on media session
    if ('setPositionState' in navigator.mediaSession && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(0, duration),
          playbackRate: 1,
          position: Math.min(currentTime, duration),
        });
      } catch (e) {}
    }
  }, [currentSong, isPlaying, currentTime, duration, onNext, onPrev]);

  // Controls
  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    try {
      if (isPlaying) {
        userIntentPlayingRef.current = false;
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        userIntentPlayingRef.current = true;
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error('Playback toggle error:', e);
    }
  }, [isPlaying]);

  // Fast direct play for any track ID
  const playTrack = useCallback((songId) => {
    userIntentPlayingRef.current = true;
    if (!playerRef.current) return;
    try {
      if (typeof playerRef.current.loadVideoById === 'function') {
        playerRef.current.loadVideoById(songId);
        playerRef.current.playVideo();
        setIsPlaying(true);
        setCurrentTime(0);
      }
    } catch (e) {
      console.error('Fast play track error:', e);
    }
  }, []);

  const seekTo = useCallback((seconds) => {
    if (!playerRef.current || typeof playerRef.current.seekTo !== 'function') return;
    playerRef.current.seekTo(seconds, true);
    setCurrentTime(seconds);
  }, []);

  const changeVolume = useCallback((newVol) => {
    if (!playerRef.current) return;
    playerRef.current.setVolume(newVol);
    setVolumeState(newVol);
    if (newVol > 0 && isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  }, [isMuted]);

  return {
    isPlaying,
    isReady,
    isBuffering,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlay,
    playTrack,
    seekTo,
    changeVolume,
    toggleMute,
  };
}
