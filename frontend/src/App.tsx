import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { SeedSearch } from './components/SeedSearch'
import { TrackCard, type TrackProps } from './components/TrackCard'
import { WeightSlider } from './components/WeightSlider'
import { LoadingGate } from './components/LoadingGate'
import { useRecommendations } from './lib/hooks'

function App() {
  // Search state — set when user submits the form
  const [seedSong, setSeedSong] = useState("")
  const [seedArtist, setSeedArtist] = useState("")
  const [hasSearched, setHasSearched] = useState(false)

  // Weight state — driven by preset buttons / slider
  const [collabWeight, setCollabWeight] = useState(0.5)
  const contentWeight = 1 - collabWeight

  // Number of recommendations
  const [numRecs, setNumRecs] = useState(10)

  // ── React Query hook — fires when seedSong + seedArtist are set ───
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useRecommendations({
    songName: seedSong,
    artistName: seedArtist,
    weightContent: contentWeight,
    weightCollaborative: collabWeight,
    numRecommendations: numRecs,
  })

  // Derive app state from query status
  const appState = !hasSearched
    ? 'idle'
    : isLoading
      ? 'loading'
      : data
        ? 'results'
        : isError
          ? 'error'
          : 'idle'

  // ── Handlers ────────────────────────────────────────────────────────
  const handleSearch = useCallback((songName: string, artistName: string) => {
    setSeedSong(songName)
    setSeedArtist(artistName)
    setHasSearched(true)
  }, [])

  const handleWeightChange = useCallback((vals: number[]) => {
    setCollabWeight(vals[0] / 100)
  }, [])

  // ── Map API response to TrackProps ──────────────────────────────────
  const mapToTrackProps = (track: any, sourceType: TrackProps['sourceType'] = 'hybrid'): TrackProps => ({
    name: track.name,
    artist: track.artist,
    previewUrl: track.spotify_preview_url,
    sourceType,
    danceability: track.danceability,
    energy: track.energy,
    valence: track.valence,
    tempo: track.tempo,
  })

  const seedTrack = data?.seed ? mapToTrackProps(data.seed, 'seed') : null
  const recommendations = data?.recommendations?.map((t: any) => mapToTrackProps(t)) ?? []

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

        {/* Header */}
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
                <LoadingGate onComplete={() => {/* React Query handles transition */}} />
              </motion.div>
            )}

            {/* Error State */}
            {appState === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-20 max-w-md mx-auto"
              >
                <div className="glass-panel p-8 rounded-2xl flex flex-col items-center gap-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                    <AlertCircle className="w-7 h-7 text-red-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Song Not Found</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {(error as any)?.detail || (error as any)?.message || "We couldn't find that song in our database. Check the spelling or try another track."}
                  </p>
                  <button
                    onClick={() => { setHasSearched(false); setSeedSong(""); setSeedArtist(""); }}
                    className="mt-2 px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-full transition-colors cursor-pointer"
                  >
                    Try Another Song
                  </button>
                </div>
              </motion.div>
            )}

            {/* Results Dashboard */}
            {appState === 'results' && seedTrack && (
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
                    <TrackCard track={seedTrack} index={0} isSeed={true} />
                  </div>
                  <WeightSlider
                    contentWeight={contentWeight}
                    collaborativeWeight={collabWeight}
                    onChange={handleWeightChange}
                  />

                  {/* Recommendation Count Selector */}
                  <div className="glass-panel p-5 rounded-xl flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-white">Results Count</h3>
                    <div className="flex gap-2">
                      {[5, 10, 15].map((n) => (
                        <button
                          key={n}
                          onClick={() => setNumRecs(n)}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                            numRecs === n
                              ? 'bg-primary/20 text-primary border border-primary/40'
                              : 'bg-white/[0.03] text-zinc-400 border border-white/[0.06] hover:bg-white/[0.06]'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Fetching indicator for weight changes */}
                  <AnimatePresence>
                    {isFetching && !isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-primary font-medium flex items-center gap-2 ml-1"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        Recalculating with new weights...
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Right Panel: Recommendations List */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                  <div className="flex items-center justify-between mb-2 ml-1">
                    <h2 className="text-xl font-bold text-white tracking-tight">Top Recommendations</h2>
                    <span className="text-sm text-muted-foreground">{recommendations.length} matches found</span>
                  </div>

                  <div className="grid gap-3">
                    {recommendations.map((track: TrackProps, i: number) => (
                      <TrackCard key={track.name + track.artist + i} track={track} index={i + 1} />
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
