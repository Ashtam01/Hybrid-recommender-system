import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SeedSearch } from './components/SeedSearch'
import { TrackCard, type TrackProps } from './components/TrackCard'
import { WeightSlider } from './components/WeightSlider'
import { LoadingGate } from './components/LoadingGate'

// --- Mock Data ---
const MOCK_SEED: TrackProps = {
  name: "Hips Don't Lie (feat. Wyclef Jean)",
  artist: "Shakira, Wyclef Jean",
  sourceType: "seed",
  danceability: 0.778,
  energy: 0.824,
  valence: 0.756,
  tempo: 100.024
};

const MOCK_RECOMMENDATIONS: TrackProps[] = [
  { name: "Whenever, Wherever", artist: "Shakira", sourceType: "content", danceability: 0.81, energy: 0.88, valence: 0.86, tempo: 108 },
  { name: "She Wolf", artist: "Shakira", sourceType: "hybrid", danceability: 0.89, energy: 0.82, valence: 0.74, tempo: 122 },
  { name: "Let's Get Loud", artist: "Jennifer Lopez", sourceType: "collaborative", danceability: 0.82, energy: 0.94, valence: 0.85, tempo: 131 },
  { name: "On The Floor", artist: "Jennifer Lopez, Pitbull", sourceType: "collaborative", danceability: 0.73, energy: 0.78, valence: 0.57, tempo: 130 },
  { name: "Waka Waka (This Time for Africa)", artist: "Shakira", sourceType: "content", danceability: 0.76, energy: 0.87, valence: 0.74, tempo: 127 },
];

function App() {
  const [appState, setAppState] = useState<'idle' | 'loading' | 'results'>('idle');
  const [collabWeight, setCollabWeight] = useState(0.7);
  const [seedQuery, setSeedQuery] = useState("");

  const contentWeight = 1 - collabWeight;

  const handleSearch = (query: string) => {
    setSeedQuery(query);
    setAppState('loading');
  };

  const handleWeightChange = (vals: number[]) => {
    setCollabWeight(vals[0] / 100);
    // In a real app, this would trigger a debounced API call
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden bg-zinc-950">
      {/* Subtle Ambient Glows & Grain */}
      <div className="absolute inset-0 bg-grain z-0" />
      <motion.div 
        animate={{ opacity: [0.03, 0.06, 0.03] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-[10%] w-[50vw] h-[50vw] bg-primary/20 rounded-full blur-[160px] pointer-events-none z-0" 
      />
      <motion.div 
        animate={{ opacity: [0.02, 0.05, 0.02] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-0 right-[10%] w-[60vw] h-[60vw] bg-secondary/15 rounded-full blur-[160px] pointer-events-none z-0" 
      />

      <main className="container mx-auto px-4 py-12 relative z-10 flex flex-col min-h-screen">
        
        {/* Sleek Professional Header */}
        <motion.header 
          layoutId="header"
          className={`flex flex-col items-center gap-6 ${appState === 'idle' ? 'mt-[15vh]' : 'mt-4 mb-12'}`}
        >
          <div className="flex flex-col items-center gap-3 text-center z-10">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-zinc-100">
              SONIC
            </h1>
            <p className="text-zinc-500 font-medium text-base md:text-lg max-w-2xl tracking-wide">
              Hybrid recommendation engine powered by content acoustics and user interaction analytics.
            </p>
          </div>
          
          <div className="w-full">
            <SeedSearch onSelect={handleSearch} />
          </div>
        </motion.header>

        {/* Dynamic Content Area */}
        <div className="flex-1 w-full max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            
            {/* Loading State */}
            {appState === 'loading' && (
              <motion.div key="loader" className="mt-20">
                <LoadingGate onComplete={() => setAppState('results')} />
              </motion.div>
            )}

            {/* Results Dashboard State */}
            {appState === 'results' && (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20"
              >
                {/* Left Panel: Seed Info & Tuner */}
                <div className="lg:col-span-4 flex flex-col gap-6 sticky top-8">
                  <div>
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 ml-1">Seed Track</h2>
                    <TrackCard track={{...MOCK_SEED, name: seedQuery || MOCK_SEED.name}} index={0} isSeed={true} />
                  </div>
                  <WeightSlider 
                    contentWeight={contentWeight} 
                    collaborativeWeight={collabWeight} 
                    onChange={handleWeightChange} 
                  />
                </div>

                {/* Right Panel: Recommendations List */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                  <div className="flex items-center justify-between mb-2 ml-1">
                    <h2 className="text-xl font-bold text-white tracking-tight">Top Recommendations</h2>
                    <span className="text-sm text-muted-foreground">{MOCK_RECOMMENDATIONS.length} matches found</span>
                  </div>
                  
                  <div className="grid gap-3">
                    {MOCK_RECOMMENDATIONS.map((track, i) => (
                      <TrackCard key={track.name + i} track={track} index={i + 1} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

export default App
