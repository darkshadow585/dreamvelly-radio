import React, { useState, useEffect, useCallback, useMemo } from 'react';
import BackgroundScene from './components/BackgroundScene';
import HeaderNav from './components/HeaderNav';
import CoverflowCarousel from './components/CoverflowCarousel';
import BottomPlayerDock from './components/BottomPlayerDock';
import PlaylistModal from './components/PlaylistModal';
import ShareModal from './components/ShareModal';
import AboutModal from './components/AboutModal';
import SearchModal from './components/SearchModal';
import StoryStudioModal from './components/StoryStudioModal';
import SoundscapeModal from './components/SoundscapeModal';
import ScreenOffOverlay from './components/ScreenOffOverlay';
import { PLAYLISTS } from './data/playlists';
import { useYouTubeRadio } from './hooks/useYouTubeRadio';
import { ambientAudio } from './utils/ambientAudio';

export default function App() {
  // Read initial playlist and song from URL query params
  const initialParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    let pId = params.get('playlist');
    if (pId === 'dreamevelly-2026' || pId === 'dreamvelly-2026') pId = 'dreamvalley-2026';
    return {
      playlistId: pId || 'barish',
      songId: params.get('song') || null,
      openModal: params.get('modal') || null,
    };
  }, []);

  // Persisted Liked Songs Vault
  const [likedSongIds, setLikedSongIds] = useState(() => {
    try {
      const saved = localStorage.getItem('dreamvalley_liked_songs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleToggleLike = useCallback((songId) => {
    if (!songId) return;
    setLikedSongIds((prev) => {
      const next = prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId];
      try {
        localStorage.setItem('dreamvalley_liked_songs', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Multi-Channel Soundscape Mixer State
  const [layerVolumes, setLayerVolumes] = useState({
    rain: 0,
    waves: 0,
    vinyl: 0,
    fire: 0,
  });

  const handleChangeLayer = useCallback((layerId, val) => {
    ambientAudio.setLayerVolume(layerId, val);
    setLayerVolumes((prev) => ({ ...prev, [layerId]: val }));
  }, []);

  const handleResetLayers = useCallback(() => {
    ambientAudio.stopAllLayers();
    setLayerVolumes({ rain: 0, waves: 0, vinyl: 0, fire: 0 });
  }, []);

  const hasActiveSoundscape = useMemo(
    () => Object.values(layerVolumes).some((v) => v > 0.01),
    [layerVolumes]
  );

  // Smart Sleep Timer (in seconds)
  const [sleepRemainingSecs, setSleepRemainingSecs] = useState(0);

  // Playlist management with dynamic custom tracks support
  const [customPlaylistSongs, setCustomPlaylistSongs] = useState(() => {
    const map = {};
    PLAYLISTS.forEach((p) => {
      map[p.id] = [...p.songs];
    });
    return map;
  });

  const [activePlaylistId, setActivePlaylistId] = useState(() => {
    const exists = PLAYLISTS.some((p) => p.id === initialParams.playlistId);
    return exists ? initialParams.playlistId : 'barish';
  });

  const activePlaylist = useMemo(() => {
    const base = PLAYLISTS.find((p) => p.id === activePlaylistId) || PLAYLISTS[0];
    return {
      ...base,
      songs: customPlaylistSongs[activePlaylistId] || base.songs,
    };
  }, [activePlaylistId, customPlaylistSongs]);

  const [currentSongIndex, setCurrentSongIndex] = useState(() => {
    if (initialParams.songId) {
      const foundIdx = activePlaylist.songs.findIndex((s) => s.id === initialParams.songId);
      if (foundIdx !== -1) return foundIdx;
    }
    return 0;
  });

  const currentSong = activePlaylist.songs[currentSongIndex] || activePlaylist.songs[0];
  const nextSong =
    activePlaylist.songs[(currentSongIndex + 1) % activePlaylist.songs.length] ||
    activePlaylist.songs[0];

  // Playback modes
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off', 'all', 'one'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isScreenOffActive, setIsScreenOffActive] = useState(false);

  // Modals
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(
    () => initialParams.openModal === 'playlist'
  );
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSoundscapeOpen, setIsSoundscapeOpen] = useState(false);
  const [isStoryStudioOpen, setIsStoryStudioOpen] = useState(
    () => initialParams.openModal === 'story'
  );

  // Handle song ending & auto next
  const handleSongEnd = useCallback(() => {
    if (repeatMode === 'one') {
      radio.seekTo(0);
      radio.togglePlay();
      return;
    }

    if (isShuffle) {
      const randomIdx = Math.floor(Math.random() * activePlaylist.songs.length);
      setCurrentSongIndex(randomIdx);
    } else {
      setCurrentSongIndex((prev) => (prev + 1) % activePlaylist.songs.length);
    }
  }, [repeatMode, isShuffle, activePlaylist.songs.length]);

  // Controls
  const handlePrev = useCallback(() => {
    setCurrentSongIndex((prev) => (prev > 0 ? prev - 1 : activePlaylist.songs.length - 1));
  }, [activePlaylist.songs.length]);

  const handleNext = useCallback(() => {
    if (isShuffle) {
      const randomIdx = Math.floor(Math.random() * activePlaylist.songs.length);
      setCurrentSongIndex(randomIdx);
    } else {
      setCurrentSongIndex((prev) => (prev + 1) % activePlaylist.songs.length);
    }
  }, [isShuffle, activePlaylist.songs.length]);

  // YouTube audio engine with MediaSession & background keep-alive
  const radio = useYouTubeRadio({
    currentSongId: currentSong?.id,
    currentSong,
    onSongEnd: handleSongEnd,
    onNext: handleNext,
    onPrev: handlePrev,
  });

  // Smart Sleep Timer Countdown Effect
  useEffect(() => {
    if (sleepRemainingSecs <= 0) return;
    const timer = setInterval(() => {
      setSleepRemainingSecs((prev) => {
        if (prev <= 1) {
          if (radio.isPlaying) radio.togglePlay();
          ambientAudio.stopAllLayers();
          setLayerVolumes({ rain: 0, waves: 0, vinyl: 0, fire: 0 });
          setIsScreenOffActive(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sleepRemainingSecs, radio.isPlaying, radio.togglePlay]);

  const handleSetSleepMinutes = useCallback((mins) => {
    setSleepRemainingSecs(mins > 0 ? mins * 60 : 0);
  }, []);

  // Sync URL when song or playlist changes
  useEffect(() => {
    if (!currentSong) return;
    const newUrl = `?playlist=${activePlaylistId}&song=${currentSong.id}`;
    window.history.replaceState(null, '', newUrl);
  }, [activePlaylistId, currentSong?.id]);

  const handleSelectSong = useCallback((index) => {
    setCurrentSongIndex(index);
  }, []);

  const handleSelectPlaylist = useCallback((playlistId) => {
    setActivePlaylistId(playlistId);
    setCurrentSongIndex(0);
  }, []);

  const handleSelectSongById = useCallback(
    (songId) => {
      const idx = activePlaylist.songs.findIndex((s) => s.id === songId);
      if (idx !== -1) {
        setCurrentSongIndex(idx);
      }
    },
    [activePlaylist.songs]
  );

  // Fast Play handler for Search & Direct YouTube Play
  const handlePlayTrack = useCallback(
    (track) => {
      if (!track || !track.id) return;

      const targetPlaylistId = activePlaylistId;
      const currentSongs = customPlaylistSongs[targetPlaylistId] || [];

      const existingIdx = currentSongs.findIndex((s) => s.id === track.id);
      if (existingIdx !== -1) {
        setCurrentSongIndex(existingIdx);
        radio.playTrack(track.id);
      } else {
        const newSong = {
          id: track.id,
          title: track.title || `Track ${track.id}`,
          artist: track.artist || 'YouTube Music',
          movie: track.isYouTube ? 'YouTube Stream' : track.movie || 'KS Lounge',
          duration: track.duration || '3:30',
          cover: track.cover || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`,
          isCustom: true,
        };

        const insertIndex = Math.min(currentSongIndex + 1, currentSongs.length);
        const updatedSongs = [
          ...currentSongs.slice(0, insertIndex),
          newSong,
          ...currentSongs.slice(insertIndex),
        ];

        setCustomPlaylistSongs((prev) => ({
          ...prev,
          [targetPlaylistId]: updatedSongs,
        }));

        setCurrentSongIndex(insertIndex);
        radio.playTrack(track.id);
      }
    },
    [activePlaylistId, customPlaylistSongs, currentSongIndex, radio.playTrack]
  );

  const handleToggleRepeat = useCallback(() => {
    setRepeatMode((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'));
  }, []);

  const handleToggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  }, []);

  // Listen for fullscreen change
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Keyboard controls: Space for play/pause, M for mute, F for fullscreen, / or Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['input', 'textarea'].includes(e.target.tagName.toLowerCase())) return;
      if (isStoryStudioOpen) return;

      if (e.code === 'Space') {
        e.preventDefault();
        radio.togglePlay();
      } else if (e.code === 'KeyM') {
        radio.toggleMute();
      } else if (e.code === 'KeyF') {
        handleToggleFullscreen();
      } else if (
        e.key === '/' ||
        (e.ctrlKey && e.key.toLowerCase() === 'k') ||
        (e.metaKey && e.key.toLowerCase() === 'k')
      ) {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [radio.togglePlay, radio.toggleMute, handleToggleFullscreen, isStoryStudioOpen]);

  return (
    <div className="relative w-full h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#070605] text-[#F4EFE8] flex flex-col justify-between font-ui">
      {/* 1. Atmospheric Background Scene & Weather/Cosmos Canvas */}
      <BackgroundScene activePlaylist={activePlaylist} />

      {/* 2. Level 5 Architectural Floating Header */}
      <HeaderNav
        activePlaylist={activePlaylist}
        isPlaying={radio.isPlaying}
        onSelectPlaylist={handleSelectPlaylist}
        onOpenPlaylistModal={() => setIsPlaylistModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        onToggleScreenOff={() => setIsScreenOffActive(true)}
        onOpenStoryStudio={() => setIsStoryStudioOpen(true)}
      />

      {/* 3. Level 5 3D Vinyl & Spatial Coverflow Stage */}
      <main className="relative z-10 flex-1 w-full min-h-0">
        <CoverflowCarousel
          songs={activePlaylist.songs}
          activeIndex={currentSongIndex}
          onSelectSong={handleSelectSong}
          onTogglePlay={radio.togglePlay}
          isPlaying={radio.isPlaying}
          activePlaylist={activePlaylist}
          onOpenSearch={() => setIsSearchModalOpen(true)}
          onOpenStoryStudio={() => setIsStoryStudioOpen(true)}
          onOpenPlaylistModal={() => setIsPlaylistModalOpen(true)}
          onOpenSoundscape={() => setIsSoundscapeOpen(true)}
          likedSongIds={likedSongIds}
          onToggleLike={handleToggleLike}
          hasActiveSoundscape={hasActiveSoundscape}
        />
      </main>

      {/* 4. Level 5 Master Acoustic Player Console */}
      <BottomPlayerDock
        currentSong={currentSong}
        nextSong={nextSong}
        isPlaying={radio.isPlaying}
        isBuffering={radio.isBuffering}
        currentTime={radio.currentTime}
        duration={radio.duration}
        volume={radio.volume}
        isMuted={radio.isMuted}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        onTogglePlay={radio.togglePlay}
        onPrev={handlePrev}
        onNext={handleNext}
        onSeek={radio.seekTo}
        onChangeVolume={radio.changeVolume}
        onToggleMute={radio.toggleMute}
        onToggleShuffle={handleToggleShuffle}
        onToggleRepeat={handleToggleRepeat}
        onOpenShare={() => setIsShareModalOpen(true)}
        onOpenPlaylistModal={() => setIsPlaylistModalOpen(true)}
        onOpenSoundscape={() => setIsSoundscapeOpen(true)}
        hasActiveSoundscape={hasActiveSoundscape}
        sleepRemainingSecs={sleepRemainingSecs}
        isLiked={currentSong ? likedSongIds.includes(currentSong.id) : false}
        onToggleLike={handleToggleLike}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* 5. Redesigned Level 5 Modals */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onPlayTrack={handlePlayTrack}
        activePlaylistId={activePlaylistId}
        currentSongId={currentSong?.id}
      />

      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        activePlaylistId={activePlaylistId}
        onSelectPlaylist={handleSelectPlaylist}
        currentSongId={currentSong?.id}
        onSelectSongById={handleSelectSongById}
        activePlaylistSongs={activePlaylist.songs}
        isPlaying={radio.isPlaying}
        onToggleShuffle={handleToggleShuffle}
        likedSongIds={likedSongIds}
        onToggleLike={handleToggleLike}
      />

      <SoundscapeModal
        isOpen={isSoundscapeOpen}
        onClose={() => setIsSoundscapeOpen(false)}
        layerVolumes={layerVolumes}
        onChangeLayer={handleChangeLayer}
        onResetLayers={handleResetLayers}
        sleepRemainingSecs={sleepRemainingSecs}
        onSetSleepMinutes={handleSetSleepMinutes}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        currentSong={currentSong}
        currentPlaylistId={activePlaylistId}
        activePlaylistName={activePlaylist.name}
      />

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />

      <StoryStudioModal
        isOpen={isStoryStudioOpen}
        onClose={() => setIsStoryStudioOpen(false)}
        onPauseRadio={() => {
          if (radio.isPlaying) radio.togglePlay();
        }}
        onResumeRadio={() => {}}
      />

      {/* 6. OLED Luxury Chronograph & Zen Blackout Overlay */}
      <ScreenOffOverlay
        isActive={isScreenOffActive}
        onClose={() => setIsScreenOffActive(false)}
        currentSong={currentSong}
        isPlaying={radio.isPlaying}
      />

      {/* 7. Hidden YouTube Audio Streamer Player Element */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: '1px',
          height: '1px',
          opacity: 0.001,
          pointerEvents: 'none',
          zIndex: -1,
          overflow: 'hidden',
          clipPath: 'inset(0)',
        }}
      >
        <div id="hidden-yt-player" />
      </div>
    </div>
  );
}
