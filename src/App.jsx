import React, { useState, useEffect, useCallback, useMemo } from 'react';
import BackgroundScene from './components/BackgroundScene';
import HeaderNav from './components/HeaderNav';
import CoverflowCarousel from './components/CoverflowCarousel';
import BottomPlayerDock from './components/BottomPlayerDock';
import PlaylistModal from './components/PlaylistModal';
import ShareModal from './components/ShareModal';
import AboutModal from './components/AboutModal';
import { PLAYLISTS } from './data/playlists';
import { useYouTubeRadio } from './hooks/useYouTubeRadio';

export default function App() {
  // Read initial playlist and song from URL query params
  const initialParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    let pId = params.get('playlist');
    if (pId === 'dreamevelly-2026') pId = 'dreamvelly-2026';
    return {
      playlistId: pId || 'barish',
      songId: params.get('song') || null,
      openModal: params.get('modal') || null,
    };
  }, []);

  const [activePlaylistId, setActivePlaylistId] = useState(() => {
    const exists = PLAYLISTS.some((p) => p.id === initialParams.playlistId);
    return exists ? initialParams.playlistId : 'barish';
  });

  const activePlaylist = useMemo(() => {
    return PLAYLISTS.find((p) => p.id === activePlaylistId) || PLAYLISTS[0];
  }, [activePlaylistId]);

  const [currentSongIndex, setCurrentSongIndex] = useState(() => {
    if (initialParams.songId) {
      const foundIdx = activePlaylist.songs.findIndex((s) => s.id === initialParams.songId);
      if (foundIdx !== -1) return foundIdx;
    }
    return 0;
  });

  const currentSong = activePlaylist.songs[currentSongIndex] || activePlaylist.songs[0];

  // Playback modes
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off', 'all', 'one'
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modals
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(() => initialParams.openModal === 'playlist');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // Handle song ending & auto next
  const handleSongEnd = useCallback(() => {
    if (repeatMode === 'one') {
      // Re-trigger current song
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

  // YouTube audio engine
  const radio = useYouTubeRadio({
    currentSongId: currentSong?.id,
    onSongEnd: handleSongEnd,
  });

  // Sync URL when song or playlist changes
  useEffect(() => {
    if (!currentSong) return;
    const newUrl = `?playlist=${activePlaylistId}&song=${currentSong.id}`;
    window.history.replaceState(null, '', newUrl);
  }, [activePlaylistId, currentSong?.id]);

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

  const handleSelectSong = useCallback((index) => {
    setCurrentSongIndex(index);
  }, []);

  const handleSelectPlaylist = useCallback((playlistId) => {
    setActivePlaylistId(playlistId);
    setCurrentSongIndex(0);
  }, []);

  const handleSelectSongById = useCallback((songId) => {
    const idx = activePlaylist.songs.findIndex((s) => s.id === songId);
    if (idx !== -1) {
      setCurrentSongIndex(idx);
    }
  }, [activePlaylist.songs]);

  const handleToggleRepeat = useCallback(() => {
    setRepeatMode((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'));
  }, []);

  const handleToggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Listen for fullscreen change
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Keyboard controls: Space for play/pause, M for mute, F for fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['input', 'textarea'].includes(e.target.tagName.toLowerCase())) return;

      if (e.code === 'Space') {
        e.preventDefault();
        radio.togglePlay();
      } else if (e.code === 'KeyM') {
        radio.toggleMute();
      } else if (e.code === 'KeyF') {
        handleToggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [radio.togglePlay, radio.toggleMute, handleToggleFullscreen]);

  return (
    <div className="relative w-full h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#0a0705] text-white flex flex-col justify-between">
      {/* 1. Atmospheric Background Scene & Dust/Rain Canvas */}
      <BackgroundScene activePlaylist={activePlaylist} />

      {/* 2. Top Header Navigation (Logo, Live Listeners Pill, Playlist Pill) */}
      <HeaderNav
        activePlaylist={activePlaylist}
        onOpenPlaylistModal={() => setIsPlaylistModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
      />

      {/* 3. 3D Coverflow Song Changing Carousel */}
      <main className="relative z-10 flex-1 w-full min-h-0">
        <CoverflowCarousel
          songs={activePlaylist.songs}
          activeIndex={currentSongIndex}
          onSelectSong={handleSelectSong}
          isPlaying={radio.isPlaying}
          activePlaylist={activePlaylist}
        />
      </main>

      {/* 4. Glassmorphic Bottom Player Dock */}
      <BottomPlayerDock
        currentSong={currentSong}
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
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* 5. Modals */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        activePlaylistId={activePlaylistId}
        onSelectPlaylist={handleSelectPlaylist}
        currentSongId={currentSong?.id}
        onSelectSongById={handleSelectSongById}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        currentSong={currentSong}
        currentPlaylistId={activePlaylistId}
      />

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />

      {/* 6. Hidden YouTube Audio Streamer Player Element */}
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
