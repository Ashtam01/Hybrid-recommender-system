import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SeedSearch } from './components/SeedSearch'
import { TrackCard, TrackProps } from './components/TrackCard'
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
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[150px] pointer-events-none" />

      <main className="container mx-auto px-4 py-12 relative z-10 flex flex-col min-h-screen">
        
        {/* Header */}
        <motion.header 
          layoutId="header"
          className={`flex flex-col items-center gap-6 ${appState === 'idle' ? 'mt-32' : 'mt-4 mb-12'}`}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60">
              SONIC GENESIS
            </h1>
            <p className="text-muted-foreground font-medium max-w-md">
              A Hybrid Recommendation Engine using Content Features & User Interactions.
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
