import { useState, useRef, useEffect } from "react";
import { Search, Loader2, User, Music } from "lucide-react";
import { Input } from "./ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useSearch, useArtistSearch } from "../lib/hooks";

interface SeedSearchProps {
  onSelect: (songName: string, artistName: string) => void;
}

export function SeedSearch({ onSelect }: SeedSearchProps) {
  const [songQuery, setSongQuery] = useState("");
  const [artistQuery, setArtistQuery] = useState("");
  const [showSongDropdown, setShowSongDropdown] = useState(false);
  const [showArtistDropdown, setShowArtistDropdown] = useState(false);
  const songDropdownRef = useRef<HTMLDivElement>(null);
  const artistDropdownRef = useRef<HTMLDivElement>(null);

  // Live fuzzy search hooks (debounced 300ms, cached 30s)
  const { data: searchResults, isFetching: isSearchingSongs } = useSearch(songQuery);
  const { data: artistResults, isFetching: isSearchingArtists } = useArtistSearch(artistQuery);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (songDropdownRef.current && !songDropdownRef.current.contains(e.target as Node)) {
        setShowSongDropdown(false);
      }
      if (artistDropdownRef.current && !artistDropdownRef.current.contains(e.target as Node)) {
        setShowArtistDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (songQuery.trim() && artistQuery.trim()) {
      setShowSongDropdown(false);
      setShowArtistDropdown(false);
      onSelect(songQuery.trim(), artistQuery.trim());
    }
  };

  const handleSelectSongResult = (name: string, artist: string) => {
    setSongQuery(name);
    setArtistQuery(artist);
    setShowSongDropdown(false);
    setShowArtistDropdown(false);
    onSelect(name, artist);
  };

  const handleSelectArtistSong = (name: string, artist: string) => {
    setSongQuery(name);
    setArtistQuery(artist);
    setShowArtistDropdown(false);
    setShowSongDropdown(false);
    onSelect(name, artist);
  };

  const handleSelectArtistOnly = (artist: string) => {
    setArtistQuery(artist);
    setShowArtistDropdown(false);
  };

  const isReady = songQuery.trim().length > 0 && artistQuery.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto mt-8"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Song Name Input + Dropdown */}
        <div className="relative" ref={songDropdownRef}>
          <div className="relative flex items-center bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-full overflow-hidden p-1.5 shadow-sm transition-all focus-within:border-primary/50 focus-within:bg-zinc-900">
            <div className="pl-5 pr-3 text-zinc-500">
              {isSearchingSongs ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </div>
            <Input
              value={songQuery}
              onChange={(e) => {
                setSongQuery(e.target.value);
                setShowSongDropdown(true);
              }}
              onFocus={() => {
                if (songQuery.length >= 2) setShowSongDropdown(true);
              }}
              placeholder="Enter a song name..."
              className="border-0 bg-transparent text-lg focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder:text-zinc-600 h-12 w-full"
            />
          </div>

          {/* Song Autocomplete Dropdown */}
          <AnimatePresence>
            {showSongDropdown && searchResults && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 top-full mt-2 w-full rounded-xl overflow-hidden glass-panel border border-white/10 shadow-2xl"
                style={{ transformOrigin: "top" }}
              >
                <div className="py-1 max-h-64 overflow-y-auto">
                  {searchResults.map((result: any, i: number) => (
                    <button
                      key={`${result.name}-${result.artist}-${i}`}
                      type="button"
                      onClick={() => handleSelectSongResult(result.name, result.artist)}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/[0.06] transition-colors text-left cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                        <Music className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-white truncate">{result.name}</span>
                        <span className="text-xs text-zinc-500 truncate">{result.artist}</span>
                      </div>
                      <span className="ml-auto text-[10px] text-zinc-600 font-mono shrink-0">{result.score}%</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Artist Name Input + Dropdown */}
        <div className="relative" ref={artistDropdownRef}>
          <div className="relative flex items-center bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-full overflow-hidden p-1.5 shadow-sm transition-all focus-within:border-secondary/50 focus-within:bg-zinc-900">
            <div className="pl-5 pr-3 text-zinc-500">
              {isSearchingArtists ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <Input
              value={artistQuery}
              onChange={(e) => {
                setArtistQuery(e.target.value);
                setShowArtistDropdown(true);
              }}
              onFocus={() => {
                if (artistQuery.length >= 2) setShowArtistDropdown(true);
              }}
              placeholder="Enter the artist name..."
              className="border-0 bg-transparent text-lg focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder:text-zinc-600 h-12 w-full"
            />
            <AnimatePresence>
              {isReady && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  type="submit"
                  className="px-6 h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm rounded-full transition-colors mr-1 cursor-pointer whitespace-nowrap"
                >
                  Analyze
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Artist Autocomplete Dropdown */}
          <AnimatePresence>
            {showArtistDropdown && artistResults && artistResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 top-full mt-2 w-full rounded-xl overflow-hidden glass-panel border border-white/10 shadow-2xl"
                style={{ transformOrigin: "top" }}
              >
                <div className="py-1 max-h-80 overflow-y-auto">
                  {artistResults.map((artistResult: any, i: number) => (
                    <div key={`artist-${artistResult.artist}-${i}`}>
                      {/* Artist header — clicking selects just the artist */}
                      <button
                        type="button"
                        onClick={() => handleSelectArtistOnly(artistResult.artist)}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/[0.06] transition-colors text-left cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-secondary" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-white truncate">{artistResult.artist}</span>
                          <span className="text-[10px] text-zinc-500">{artistResult.songs.length} songs</span>
                        </div>
                        <span className="ml-auto text-[10px] text-zinc-600 font-mono shrink-0">{artistResult.score}%</span>
                      </button>

                      {/* Song list under this artist */}
                      {artistResult.songs.map((song: any, j: number) => (
                        <button
                          key={`song-${song.name}-${j}`}
                          type="button"
                          onClick={() => handleSelectArtistSong(song.name, artistResult.artist)}
                          className="w-full flex items-center gap-3 pl-14 pr-5 py-2 hover:bg-white/[0.06] transition-colors text-left cursor-pointer"
                        >
                          <Music className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="text-xs text-zinc-400 truncate">{song.name}</span>
                        </button>
                      ))}

                      {/* Separator between artists */}
                      {i < artistResults.length - 1 && (
                        <div className="mx-5 border-t border-white/5" />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>
    </motion.div>
  );
}
