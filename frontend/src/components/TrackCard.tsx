import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Disc3, Zap, Activity, Waves, VolumeX } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { motion } from 'framer-motion';

export interface TrackProps {
  name: string;
  artist: string;
  previewUrl?: string;
  sourceType?: 'content' | 'collaborative' | 'hybrid' | 'seed';
  danceability?: number;
  energy?: number;
  valence?: number;
  tempo?: number;
}

// Module-level ref to the currently playing audio — ensures only one track plays at a time
let globalAudio: HTMLAudioElement | null = null;
let globalSetPlaying: ((v: boolean) => void) | null = null;

export function TrackCard({ track, index, isSeed = false }: { track: TrackProps, index: number, isSeed?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const hasPreview = !!track.previewUrl;

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = () => {
    if (!hasPreview) return;

    if (isPlaying) {
      // Pause current
      audioRef.current?.pause();
      setIsPlaying(false);
      globalAudio = null;
      globalSetPlaying = null;
    } else {
      // Stop whatever else is playing globally
      if (globalAudio && globalAudio !== audioRef.current) {
        globalAudio.pause();
        globalSetPlaying?.(false);
      }

      // Create audio element if needed, or reuse
      if (!audioRef.current || audioRef.current.src !== track.previewUrl) {
        audioRef.current = new Audio(track.previewUrl);
        audioRef.current.addEventListener("ended", () => {
          setIsPlaying(false);
          globalAudio = null;
          globalSetPlaying = null;
        });
      }

      audioRef.current.play();
      setIsPlaying(true);
      globalAudio = audioRef.current;
      globalSetPlaying = setIsPlaying;
    }
  };

  const formatBPM = (tempo?: number) => tempo ? `${Math.round(tempo)} BPM` : '-- BPM';
  const formatStat = (val?: number) => val ? `${(val * 100).toFixed(0)}%` : '--%';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -6 }}
    >
      <Card className={`overflow-hidden glass-panel border-white/5 transition-all duration-300 ${isSeed ? 'spotify-glow border-primary/30' : 'hover:border-primary/50'}`}>
        <CardContent className="p-5 flex flex-col gap-4">
          {/* Header Row */}
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={togglePlay}
                disabled={!hasPreview}
                title={hasPreview ? (isPlaying ? "Pause preview" : "Play preview") : "No preview available"}
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  !hasPreview
                    ? 'bg-white/5 text-zinc-600 cursor-not-allowed'
                    : isPlaying
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {!hasPreview ? (
                  <VolumeX className="w-5 h-5" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-1" />
                )}
              </button>
              <div className="flex flex-col">
                <h3 className="font-bold text-lg leading-tight text-white line-clamp-1">{track.name}</h3>
                <p className="text-muted-foreground text-sm font-medium">{track.artist}</p>
              </div>
            </div>
          </div>

          {/* Audio Features Visualizer */}
          <div className="grid grid-cols-4 gap-2 mt-2 pt-4 border-t border-white/5">
            <div className="flex flex-col items-center gap-1.5" title="Danceability">
              <div className="flex items-center gap-1.5 text-cyan-400">
                <Disc3 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Dance</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">{formatStat(track.danceability)}</span>
            </div>
            <div className="flex flex-col items-center gap-1.5" title="Energy">
              <div className="flex items-center gap-1.5 text-orange-400">
                <Zap className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Energy</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">{formatStat(track.energy)}</span>
            </div>
            <div className="flex flex-col items-center gap-1.5" title="Valence (Positivity)">
              <div className="flex items-center gap-1.5 text-yellow-400">
                <Activity className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Mood</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">{formatStat(track.valence)}</span>
            </div>
            <div className="flex flex-col items-center gap-1.5" title="Tempo">
              <div className="flex items-center gap-1.5 text-primary">
                <Waves className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Tempo</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">{formatBPM(track.tempo)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
