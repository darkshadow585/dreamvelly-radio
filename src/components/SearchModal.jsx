import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Play, Sparkles, Youtube, Loader2, Disc3, Music2, ExternalLink } from 'lucide-react';
import { PLAYLISTS } from '../data/playlists';

// Helper to extract YouTube video ID from links or raw 11-char IDs
function extractYouTubeVideoId(input) {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(
    /(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i
  );
  return match ? match[1] : null;
}

const QUICK_TAGS = [
  '🌧️ Barish Songs',
  'Arijit Singh',
  'Atif Aslam',
  'Baarish',
  'Monsoon Melodies',
  'Jubin Nautiyal',
  'Acoustic Chill',
];

export default function SearchModal({
  isOpen,
  onClose,
  onPlayTrack,
  activePlaylistId,
  currentSongId,
}) {
  const [query, setQuery] = useState('');
  const [ytResults, setYtResults] = useState([]);
  const [isSearchingYT, setIsSearchingYT] = useState(false);
  const [detectedYtTrack, setDetectedYtTrack] = useState(null);
  const [isLoadingDetected, setIsLoadingDetected] = useState(false);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    } else {
      setQuery('');
      setYtResults([]);
      setDetectedYtTrack(null);
    }
  }, [isOpen]);

  // Keyboard shortcut (Escape to close)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Aggregate all catalogue songs, prioritizing the Barish section
  const allCuratedSongs = useMemo(() => {
    const list = [];
    const barishPlaylist = PLAYLISTS.find((p) => p.id === 'barish') || PLAYLISTS[0];
    const otherPlaylists = PLAYLISTS.filter((p) => p.id !== 'barish');

    // Add Barish songs first
    barishPlaylist.songs.forEach((song) => {
      list.push({
        ...song,
        playlistName: barishPlaylist.name,
        playlistId: barishPlaylist.id,
        isBarish: true,
      });
    });

    // Add other curated songs
    otherPlaylists.forEach((pl) => {
      pl.songs.forEach((song) => {
        if (!list.some((s) => s.id === song.id)) {
          list.push({
            ...song,
            playlistName: pl.name,
            playlistId: pl.id,
            isBarish: false,
          });
        }
      });
    });

    return list;
  }, []);

  // Filter curated songs based on query
  const localResults = useMemo(() => {
    if (!query.trim()) {
      // Default to top 8 Barish tracks if empty query
      return allCuratedSongs.filter((s) => s.isBarish).slice(0, 8);
    }

    const q = query.toLowerCase().trim();
    return allCuratedSongs
      .filter((s) => {
        const titleMatch = s.title?.toLowerCase().includes(q);
        const artistMatch = s.artist?.toLowerCase().includes(q);
        const movieMatch = s.movie?.toLowerCase().includes(q);
        return titleMatch || artistMatch || movieMatch;
      })
      .slice(0, 10);
  }, [query, allCuratedSongs]);

  // Detect YouTube URL or ID in input
  useEffect(() => {
    const ytId = extractYouTubeVideoId(query);
    if (ytId) {
      setIsLoadingDetected(true);
      fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`)
        .then((res) => {
          if (!res.ok) throw new Error('Not found');
          return res.json();
        })
        .then((data) => {
          setDetectedYtTrack({
            id: ytId,
            title: data.title || `YouTube Track (${ytId})`,
            artist: data.author_name || 'YouTube Creator',
            cover: data.thumbnail_url || `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
            duration: 'Live / Audio',
            isYouTube: true,
          });
        })
        .catch(() => {
          setDetectedYtTrack({
            id: ytId,
            title: `YouTube Track (${ytId})`,
            artist: 'YouTube Stream',
            cover: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
            duration: '3:30',
            isYouTube: true,
          });
        })
        .finally(() => {
          setIsLoadingDetected(false);
        });
    } else {
      setDetectedYtTrack(null);
    }
  }, [query]);

  // Debounced live YouTube search via Vite server middleware
  useEffect(() => {
    if (!query.trim() || extractYouTubeVideoId(query)) {
      setYtResults([]);
      setIsSearchingYT(false);
      return;
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      setIsSearchingYT(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.items)) {
            setYtResults(data.items);
          }
        }
      } catch (e) {
        // Fallback or offline
        console.log('YouTube search API not available, relying on catalogue and direct links');
      } finally {
        setIsSearchingYT(false);
      }
    }, 450);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  const handleSelectSong = (track) => {
    onPlayTrack(track);
    onClose();
  };

  const handleKeyDownInput = (e) => {
    if (e.key === 'Enter') {
      if (detectedYtTrack) {
        handleSelectSong(detectedYtTrack);
      } else if (localResults.length > 0) {
        handleSelectSong(localResults[0]);
      } else if (ytResults.length > 0) {
        handleSelectSong(ytResults[0]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2.5 sm:p-4 pt-12 sm:pt-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[88dvh] bg-[#120e0b]/95 border border-amber-400/30 rounded-2xl sm:rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col text-[#F4EFE8] ring-1 ring-white/10"
      >
        {/* Search Header Bar */}
        <div className="p-3.5 sm:p-5 border-b border-white/10 bg-black/40 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm sm:text-base">
              <Sparkles size={18} className="text-amber-400" />
              <span>Search & Fast YouTube Play</span>
              <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-200 border border-amber-400/30">
                BARISH RADIO
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition"
              aria-label="Close search"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Input Box */}
          <div className="relative flex items-center">
            <Search
              size={19}
              className="absolute left-3.5 text-amber-300/70 pointer-events-none"
            />

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDownInput}
              placeholder="Search Barish songs, artists, or paste YouTube link..."
              className="w-full pl-10 pr-24 py-2.5 sm:py-3 bg-black/60 border border-amber-400/35 focus:border-amber-400 rounded-xl text-sm sm:text-base text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-amber-400/30 transition-all shadow-inner"
            />

            <div className="absolute right-2.5 flex items-center gap-1.5">
              {isSearchingYT && (
                <Loader2 size={16} className="text-amber-400 animate-spin" />
              )}
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 text-white/50 hover:text-white transition"
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
              <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/50 border border-white/10">
                ↵ ENTER
              </span>
            </div>
          </div>

          {/* Quick Tags Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag.replace('🌧️ ', ''))}
                className="flex-shrink-0 text-xs px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-amber-400/20 hover:text-amber-200 border border-white/10 hover:border-amber-400/30 text-white/70 transition-all font-medium"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Results Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 no-scrollbar">
          {/* 1. DIRECT YOUTUBE LINK / ID DETECTED */}
          {detectedYtTrack && (
            <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-amber-950/20 to-black/60 border border-red-500/40 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                  <Youtube size={15} /> DIRECT YOUTUBE TRACK DETECTED
                </span>
                <span className="text-[10px] font-mono bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/30">
                  Instant Play
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <img
                  src={detectedYtTrack.cover}
                  alt={detectedYtTrack.title}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-white/20 shadow-md flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm sm:text-base font-semibold text-white truncate">
                    {detectedYtTrack.title}
                  </h4>
                  <p className="text-xs text-white/60 truncate">
                    {detectedYtTrack.artist}
                  </p>
                  <p className="text-[11px] text-amber-300/80 font-mono mt-0.5">
                    Ready to stream via YouTube Iframe
                  </p>
                </div>

                <button
                  onClick={() => handleSelectSong(detectedYtTrack)}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-semibold text-xs sm:text-sm rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0"
                >
                  <Play size={15} fill="currentColor" /> Play Now
                </button>
              </div>
            </div>
          )}

          {/* 2. CURATED BARISH & LOUNGE TRACKS */}
          {localResults.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] uppercase tracking-wider text-amber-300/70 font-semibold flex items-center justify-between">
                <span>Curated Tracks {query ? `for "${query}"` : 'in Barish'}</span>
                <span className="font-mono text-white/40">{localResults.length} Tracks</span>
              </div>

              <div className="mt-1.5 space-y-1.5">
                {localResults.map((song, idx) => {
                  const isCurrent = song.id === currentSongId;
                  return (
                    <div
                      key={`local-${song.id}-${idx}`}
                      onClick={() => handleSelectSong(song)}
                      className={`flex items-center gap-3.5 p-2.5 rounded-xl cursor-pointer transition-all group ${
                        isCurrent
                          ? 'bg-amber-400/20 border border-amber-400/40 text-white shadow-md'
                          : 'hover:bg-white/[0.07] text-white/80 border border-transparent'
                      }`}
                    >
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-black/40 border border-white/10 relative shadow-sm">
                        <img
                          src={song.cover}
                          alt={song.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {isCurrent && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Disc3 size={18} className="text-amber-400 animate-spin" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p
                            className={`text-sm font-medium truncate ${
                              isCurrent ? 'text-amber-300 font-semibold' : 'text-[#F4EFE8]'
                            }`}
                          >
                            {song.title}
                          </p>
                          {song.isBarish && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/15 text-amber-300 border border-amber-400/25 flex-shrink-0">
                              🌧️ Barish
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#F4EFE8]/50 truncate">
                          {song.artist} {song.movie ? `• ${song.movie}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-[#F4EFE8]/40 font-mono tabular-nums">
                          {song.duration}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectSong(song);
                          }}
                          className="p-2 rounded-lg bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-black transition-all"
                          title="Play track"
                        >
                          <Play size={14} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. LIVE YOUTUBE SEARCH RESULTS */}
          {ytResults.length > 0 && (
            <div className="pt-2">
              <div className="px-2 py-1 text-[11px] uppercase tracking-wider text-red-400/80 font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Youtube size={14} className="text-red-500" /> YouTube Search Results
                </span>
                <span className="font-mono text-white/40">{ytResults.length} Videos</span>
              </div>

              <div className="mt-1.5 space-y-1.5">
                {ytResults.map((video) => (
                  <div
                    key={`yt-${video.id}`}
                    onClick={() => handleSelectSong(video)}
                    className="flex items-center gap-3.5 p-2.5 rounded-xl cursor-pointer hover:bg-red-500/[0.08] border border-white/5 hover:border-red-500/30 transition-all group"
                  >
                    <div className="w-14 h-10 sm:w-16 sm:h-11 rounded-lg overflow-hidden flex-shrink-0 bg-black/40 border border-white/10 relative shadow-sm">
                      <img
                        src={video.cover}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-[#F4EFE8] truncate group-hover:text-amber-200 transition">
                        {video.title}
                      </h4>
                      <p className="text-xs text-[#F4EFE8]/50 truncate">
                        {video.artist}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <span className="text-xs text-[#F4EFE8]/40 font-mono tabular-nums">
                        {video.duration}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSong(video);
                        }}
                        className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white transition-all"
                        title="Fast Play via YouTube"
                      >
                        <Play size={14} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state when no matches */}
          {localResults.length === 0 && ytResults.length === 0 && !detectedYtTrack && (
            <div className="py-12 text-center text-white/50 space-y-2">
              <Music2 size={32} className="mx-auto text-amber-400/40" />
              <p className="text-sm">No songs found for "{query}"</p>
              <p className="text-xs text-white/35 max-w-sm mx-auto">
                Tip: Paste any YouTube link (e.g. https://youtu.be/...) or video ID directly to play fast!
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 px-5 border-t border-white/10 bg-black/40 flex items-center justify-between text-[11px] text-[#F4EFE8]/45">
          <span>Fast YouTube Iframe Playback • Lossless Streaming</span>
          <span className="hidden sm:inline font-mono">Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
}
