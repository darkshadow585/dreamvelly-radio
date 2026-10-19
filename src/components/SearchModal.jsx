import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Play, Youtube, Loader2, Music2, ArrowUpRight } from 'lucide-react';
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

const QUICK_FILTERS = [
  'Barish',
  'Arijit Singh',
  'Atif Aslam',
  'Jubin Nautiyal',
  'Shreya Ghoshal',
  'Pritam',
  'Acoustic',
];

export default function SearchModal({
  isOpen,
  onClose,
  onPlayTrack,
  currentSongId,
}) {
  const [query, setQuery] = useState('');
  const [ytResults, setYtResults] = useState([]);
  const [isSearchingYT, setIsSearchingYT] = useState(false);
  const [detectedYtTrack, setDetectedYtTrack] = useState(null);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 80);
    } else {
      setQuery('');
      setYtResults([]);
      setDetectedYtTrack(null);
    }
  }, [isOpen]);

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

  const allCuratedSongs = useMemo(() => {
    const list = [];
    const barishPlaylist = PLAYLISTS.find((p) => p.id === 'barish') || PLAYLISTS[0];
    const otherPlaylists = PLAYLISTS.filter((p) => p.id !== 'barish');

    barishPlaylist.songs.forEach((song) => {
      list.push({
        ...song,
        playlistName: barishPlaylist.name.replace(/[^\w\s-]/g, '').trim(),
        playlistId: barishPlaylist.id,
      });
    });

    otherPlaylists.forEach((pl) => {
      pl.songs.forEach((song) => {
        if (!list.some((s) => s.id === song.id)) {
          list.push({
            ...song,
            playlistName: pl.name.replace(/[^\w\s-]/g, '').trim(),
            playlistId: pl.id,
          });
        }
      });
    });

    return list;
  }, []);

  const localResults = useMemo(() => {
    if (!query.trim()) {
      return allCuratedSongs.slice(0, 8);
    }

    const q = query.toLowerCase().trim();
    return allCuratedSongs
      .filter((s) => {
        const titleMatch = s.title?.toLowerCase().includes(q);
        const artistMatch = s.artist?.toLowerCase().includes(q);
        const movieMatch = s.movie?.toLowerCase().includes(q);
        const stationMatch = s.playlistName?.toLowerCase().includes(q);
        return titleMatch || artistMatch || movieMatch || stationMatch;
      })
      .slice(0, 10);
  }, [query, allCuratedSongs]);

  // Detect YouTube URL or ID in input
  useEffect(() => {
    const ytId = extractYouTubeVideoId(query);
    if (ytId) {
      fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`
      )
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
            duration: 'Direct Stream',
            isYouTube: true,
          });
        })
        .catch(() => {
          setDetectedYtTrack({
            id: ytId,
            title: `YouTube Track (${ytId})`,
            artist: 'YouTube Direct Stream',
            cover: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
            duration: 'Direct Stream',
            isYouTube: true,
          });
        });
    } else {
      setDetectedYtTrack(null);
    }
  }, [query]);

  // Debounced live YouTube search
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.items)) {
            setYtResults(data.items);
          } else {
            setYtResults([]);
          }
        } else {
          setYtResults([]);
        }
      } catch {
        setYtResults([]);
      } finally {
        setIsSearchingYT(false);
      }
    }, 380);

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
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 pt-12 sm:pt-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[86dvh] luxury-modal rounded-3xl overflow-hidden flex flex-col text-[#F4EFE8]"
      >
        {/* 1. COMMAND INPUT BAR */}
        <div className="p-4 sm:p-6 border-b border-white/[0.08] bg-[#0b0a09] space-y-3.5">
          <div className="relative flex items-center">
            <Search
              size={18}
              className="absolute left-4 text-[#D4A359] pointer-events-none"
            />

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDownInput}
              placeholder="Search songs, artists, or paste any YouTube URL..."
              className="w-full pl-11 pr-24 py-3 bg-[#141210] border border-white/[0.1] focus:border-[#D4A359]/60 rounded-2xl text-sm sm:text-base text-[#F4EFE8] placeholder-[#8C857B] outline-none transition-all"
            />

            <div className="absolute right-3 flex items-center gap-2">
              {isSearchingYT && (
                <Loader2 size={15} className="text-[#D4A359] animate-spin" />
              )}
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 text-[#8C857B] hover:text-white transition cursor-pointer"
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-[#8C857B] hover:text-white rounded-lg hover:bg-white/[0.06] transition cursor-pointer"
                title="Close (Esc)"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Interactive Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_FILTERS.map((tag) => {
              const active = query.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  onClick={() => setQuery(active ? '' : tag)}
                  className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    active
                      ? 'bg-[#F4EFE8] text-[#090807] font-semibold'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] text-[#A8A096] hover:text-[#F4EFE8]'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. RESULTS STREAM */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 no-scrollbar">
          {/* DIRECT YOUTUBE URL DETECTED */}
          {detectedYtTrack && (
            <div className="p-4 rounded-2xl bg-[#181410] border border-[#D4A359]/45 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src={detectedYtTrack.cover}
                  alt={detectedYtTrack.title}
                  className="w-16 h-12 rounded-xl object-cover border border-white/15 flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-[10px] font-mono-tabular uppercase tracking-widest text-[#D4A359] mb-0.5">
                    Direct YouTube Stream Ready
                  </div>
                  <h4 className="text-sm font-semibold text-[#F4EFE8] truncate">
                    {detectedYtTrack.title}
                  </h4>
                  <p className="text-xs text-[#9E968B] truncate">
                    {detectedYtTrack.artist}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleSelectSong(detectedYtTrack)}
                className="px-4 py-2.5 rounded-full bg-[#F4EFE8] hover:bg-white text-[#090807] font-semibold text-xs flex items-center gap-1.5 flex-shrink-0 transition cursor-pointer"
              >
                <Play size={13} fill="currentColor" />
                <span>Play Now</span>
              </button>
            </div>
          )}

          {/* CURATED STUDIO CATALOGUE */}
          {localResults.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 text-[11px] font-mono-tabular uppercase tracking-[0.18em] text-[#8C857B]">
                <span>Studio Catalogue</span>
                <span>{localResults.length} Tracks</span>
              </div>

              <div className="space-y-1">
                {localResults.map((song, idx) => {
                  const isCurrent = song.id === currentSongId;
                  return (
                    <div
                      key={`local-${song.id}-${idx}`}
                      onClick={() => handleSelectSong(song)}
                      className={`flex items-center gap-3.5 p-2.5 rounded-xl cursor-pointer transition-all group ${
                        isCurrent
                          ? 'bg-[#1a1612] border border-[#D4A359]/40 text-[#F4EFE8]'
                          : 'hover:bg-white/[0.04] text-[#EAE5DF]/85 border border-transparent'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-black/40 border border-white/10">
                        <img
                          src={song.cover}
                          alt={song.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm truncate ${
                            isCurrent
                              ? 'text-[#D4A359] font-semibold'
                              : 'text-[#F4EFE8] font-medium'
                          }`}
                        >
                          {song.title}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-[#9E968B] truncate mt-0.5">
                          <span className="truncate">{song.artist}</span>
                          {song.movie && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate text-[#8C857B]">{song.movie}</span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="text-[#D4A359]/80">{song.playlistName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-[#8C857B] font-mono-tabular">
                          {song.duration}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-white/[0.06] group-hover:bg-[#F4EFE8] text-[#EAE5DF] group-hover:text-[#090807] flex items-center justify-center transition-colors">
                          <Play size={13} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LIVE YOUTUBE GLOBAL STREAM RESULTS */}
          {ytResults.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between px-1 text-[11px] font-mono-tabular uppercase tracking-[0.18em] text-[#8C857B]">
                <span className="flex items-center gap-1.5">
                  <Youtube size={13} className="text-[#D4A359]" />
                  <span>Global YouTube Stream</span>
                </span>
                <span>{ytResults.length} Results</span>
              </div>

              <div className="space-y-1">
                {ytResults.map((video) => (
                  <div
                    key={`yt-${video.id}`}
                    onClick={() => handleSelectSong(video)}
                    className="flex items-center gap-3.5 p-2.5 rounded-xl cursor-pointer hover:bg-white/[0.04] border border-transparent hover:border-white/[0.08] transition-all group"
                  >
                    <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-black/40 border border-white/10">
                      <img
                        src={video.cover}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-[#F4EFE8] truncate group-hover:text-[#D4A359] transition-colors">
                        {video.title}
                      </h4>
                      <p className="text-xs text-[#9E968B] truncate mt-0.5">
                        {video.artist}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-[#8C857B] font-mono-tabular">
                        {video.duration}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-white/[0.06] group-hover:bg-[#D4A359] text-[#EAE5DF] group-hover:text-[#090807] flex items-center justify-center transition-colors">
                        <ArrowUpRight size={14} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isSearchingYT &&
            localResults.length === 0 &&
            ytResults.length === 0 &&
            !detectedYtTrack &&
            query.trim() && (
              <div className="py-12 text-center text-[#8C857B] space-y-2">
                <Music2 size={28} className="mx-auto text-[#D4A359]/50" />
                <p className="text-sm text-[#EAE5DF]">No tracks found for “{query}”</p>
                <p className="text-xs text-[#8C857B] max-w-sm mx-auto">
                  Paste any YouTube link or 11-character video ID to stream it immediately.
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
