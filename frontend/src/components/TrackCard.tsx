import { useState } from 'react';
import { Play, Pause, Disc3, Zap, Activity, Waves } from 'lucide-react';
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

export function TrackCard({ track, index, isSeed = false }: { track: TrackProps, index: number, isSeed?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);

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
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isPlaying ? 'bg-primary text-primary-foreground' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
              </button>
              <div className="flex flex-col">
                <h3 className="font-bold text-lg leading-tight text-white line-clamp-1">{track.name}</h3>
                <p className="text-muted-foreground text-sm font-medium">{track.artist}</p>
              </div>
            </div>
            {track.sourceType && (
              <Badge variant="outline" className={`capitalize shrink-0 ${
                track.sourceType === 'hybrid' ? 'border-pink-500/50 text-pink-400' :
                track.sourceType === 'collaborative' ? 'border-secondary/50 text-secondary-foreground' :
                track.sourceType === 'seed' ? 'border-primary/50 text-primary' :
                'border-cyan-500/50 text-cyan-400'
              }`}>
                {track.sourceType} Match
              </Badge>
            )}
          </div>

          {/* Audio Features Visualizer */}
          <div className="grid grid-cols-4 gap-2 mt-2 pt-4 border-t border-white/5">
            <div className="flex flex-col items-center gap-1" title="Danceability">
              <Disc3 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono text-muted-foreground">{formatStat(track.danceability)}</span>
            </div>
            <div className="flex flex-col items-center gap-1" title="Energy">
              <Zap className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-mono text-muted-foreground">{formatStat(track.energy)}</span>
            </div>
            <div className="flex flex-col items-center gap-1" title="Valence (Positivity)">
              <Activity className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-mono text-muted-foreground">{formatStat(track.valence)}</span>
            </div>
            <div className="flex flex-col items-center gap-1" title="Tempo">
              <Waves className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono text-muted-foreground">{formatBPM(track.tempo)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
