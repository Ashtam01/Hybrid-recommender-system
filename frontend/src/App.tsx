import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Wand2, Users, Blend, Headphones, Cpu, BarChart3, ArrowRight } from 'lucide-react'
import { SeedSearch } from './components/SeedSearch'
import { TrackCard, type TrackProps } from './components/TrackCard'
import { WeightSlider } from './components/WeightSlider'
import { LoadingGate } from './components/LoadingGate'
import { useRecommendations } from './lib/hooks'

// ── Animated counter for hero stats ──────────────────────────────────
function AnimatedStat({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="flex flex-col items-center"
    >
      <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-emerald-300 bg-clip-text text-transparent">
        {value}
      </span>
      <span className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-medium">{label}</span>
    </motion.div>
  )
}

// ── Feature card component ───────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, color, delay }: {
  icon: any; title: string; description: string; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="glass-panel p-6 rounded-2xl flex flex-col gap-3 group cursor-default"
    >
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
    </motion.div>
  )
}

// ── How it works step ────────────────────────────────────────────────
function Step({ number, title, description, delay }: {
  number: number; title: string; description: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex gap-4 items-start"
    >
      <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-xs font-bold text-primary">{number}</span>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}

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

        {/* ═══════════════════ LANDING PAGE (idle) ═══════════════════ */}
        {appState === 'idle' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30 }}
            className="flex flex-col items-center"
          >
            {/* Hero Section */}
            <div className="mt-[8vh] flex flex-col items-center text-center max-w-3xl mx-auto">
              {/* Badge */}


              {/* Title with gradient */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-5xl md:text-7xl font-extrabold tracking-tight"
              >
                <span className="text-zinc-100">SONIC</span>
                <br />
                <span className="bg-gradient-to-r from-primary via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  Recommender
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="text-zinc-400 text-base md:text-lg max-w-xl mt-5 leading-relaxed"
              >
                Discover music through the lens of <span className="text-zinc-200 font-medium">audio acoustics</span> and <span className="text-zinc-200 font-medium">user listening patterns</span>. Our hybrid engine blends two ML approaches for precision recommendations.
              </motion.p>

              {/* Stats Row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="flex items-center gap-8 md:gap-12 mt-8 py-4 px-6 rounded-2xl bg-white/[0.02] border border-white/[0.04]"
              >
                <AnimatedStat value="75K+" label="Tracks" delay={0.6} />
                <div className="w-px h-8 bg-white/10" />
                <AnimatedStat value="1M+" label="Interactions" delay={0.7} />
                <div className="w-px h-8 bg-white/10" />
                <AnimatedStat value="3" label="ML Models" delay={0.8} />
              </motion.div>
            </div>

            {/* Search Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="w-full max-w-2xl mt-4"
            >
              <SeedSearch onSelect={handleSearch} />
            </motion.div>

            {/* How It Works */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="w-full max-w-3xl mt-16"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">How It Works</span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Step
                  number={1}
                  title="Pick a Seed Track"
                  description="Search for any song you love. Our fuzzy engine matches across 75K+ tracks."
                  delay={0.9}
                />
                <Step
                  number={2}
                  title="Tune the Algorithm"
                  description="Adjust the content vs. collaborative weight to control how recommendations are generated."
                  delay={1.0}
                />
                <Step
                  number={3}
                  title="Explore & Listen"
                  description="Preview recommended tracks instantly with Spotify audio previews and acoustic analysis."
                  delay={1.1}
                />
              </div>
            </motion.div>

            {/* Feature Cards */}
            <div className="w-full max-w-3xl mt-12 mb-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FeatureCard
                  icon={Wand2}
                  title="Content-Based Filtering"
                  description="Analyzes audio features — danceability, energy, valence, tempo — using TF-IDF vectors and cosine similarity."
                  color="bg-cyan-500/20"
                  delay={1.1}
                />
                <FeatureCard
                  icon={Users}
                  title="Collaborative Filtering"
                  description="Learns from 1M+ user listening sessions to find songs that people with similar taste enjoy."
                  color="bg-secondary/20"
                  delay={1.2}
                />
                <FeatureCard
                  icon={Blend}
                  title="Hybrid Engine"
                  description="Combines both approaches with adjustable weights. Rank-normalized scores ensure fair blending."
                  color="bg-primary/20"
                  delay={1.3}
                />
              </div>
            </div>

            {/* Tech Stack Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-3 mb-8"
            >
              {['React', 'FastAPI', 'scikit-learn', 'scipy', 'TanStack Query', 'Dask'].map((tech, i) => (
                <span
                  key={tech}
                  className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/[0.04] border border-white/[0.06] text-zinc-500"
                >
                  {tech}
                </span>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* ═══════════════ NON-IDLE STATES (compact header) ═══════════════ */}
        {appState !== 'idle' && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 mt-4 mb-12"
          >
            <div className="flex items-center gap-3 z-10">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-100">
                SONIC
              </h1>
              <span className="text-xl text-zinc-600 font-light">|</span>
              <span className="text-sm text-zinc-500 font-medium">Recommender</span>
            </div>
            <div className="w-full max-w-2xl">
              <SeedSearch onSelect={handleSearch} />
            </div>
          </motion.header>
        )}

        {/* Dynamic Content Area */}
        <div className="flex-1 w-full max-w-6xl mx-auto">
          <AnimatePresence mode="wait">

            {/* Loading State */}
            {appState === 'loading' && (
              <motion.div key="loader" className="mt-20">
                <LoadingGate onComplete={() => {/* React Query handles transition */ }} />
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
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${numRecs === n
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
