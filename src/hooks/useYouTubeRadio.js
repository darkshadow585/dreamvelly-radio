import { useState, useEffect, useRef, useCallback } from 'react';

export function useYouTubeRadio({ currentSongId, onSongEnd }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(80);
  const [isMuted, setIsMuted] = useState(false);

  const playerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const currentSongIdRef = useRef(currentSongId);
  currentSongIdRef.current = currentSongId;

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
          },
          onStateChange: (event) => {
            // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setIsBuffering(false);
              const dur = event.target.getDuration();
              if (dur) setDuration(dur);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              setIsBuffering(false);
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
            // On error 101 or 150 (not embeddable) auto advance
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
          if (curr) setCurrentTime(curr);
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
  useEffect(() => {
    if (!isReady || !playerRef.current || !currentSongId) return;

    try {
      if (typeof playerRef.current.loadVideoById === 'function') {
        playerRef.current.loadVideoById(currentSongId);
        setCurrentTime(0);
        if (isPlaying) {
          playerRef.current.playVideo();
        }
      }
    } catch (e) {
      console.error('Failed to switch video:', e);
    }
  }, [currentSongId, isReady]);

  // Controls
  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error('Playback toggle error:', e);
    }
  }, [isPlaying]);

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
    seekTo,
    changeVolume,
    toggleMute,
  };
}
