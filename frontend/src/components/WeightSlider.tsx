import { useState } from "react";
import { Slider } from "./ui/slider";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Users, Zap, ChevronDown, SlidersHorizontal } from "lucide-react";

type PresetMode = "sound-alike" | "balanced" | "fan-favorites" | "custom";

interface PresetConfig {
  id: PresetMode;
  label: string;
  description: string;
  icon: React.ReactNode;
  contentWeight: number;
  collabWeight: number;
  accentClass: string;
  bgClass: string;
  borderClass: string;
  glowClass: string;
}

const PRESETS: PresetConfig[] = [
  {
    id: "sound-alike",
    label: "Sound-alike",
    description: "Songs that sound similar",
    icon: <Music className="w-4 h-4" />,
    contentWeight: 0.8,
    collabWeight: 0.2,
    accentClass: "text-cyan-400",
    bgClass: "bg-cyan-500/10",
    borderClass: "border-cyan-500/40",
    glowClass: "shadow-[0_0_20px_-4px_rgba(6,182,212,0.3)]",
  },
  {
    id: "balanced",
    label: "Best of Both",
    description: "Balanced blend",
    icon: <Zap className="w-4 h-4" />,
    contentWeight: 0.5,
    collabWeight: 0.5,
    accentClass: "text-primary",
    bgClass: "bg-primary/10",
    borderClass: "border-primary/40",
    glowClass: "shadow-[0_0_20px_-4px_rgba(30,215,96,0.3)]",
  },
  {
    id: "fan-favorites",
    label: "Fan Favorites",
    description: "What listeners also enjoy",
    icon: <Users className="w-4 h-4" />,
    contentWeight: 0.2,
    collabWeight: 0.8,
    accentClass: "text-secondary",
    bgClass: "bg-secondary/10",
    borderClass: "border-secondary/40",
    glowClass: "shadow-[0_0_20px_-4px_rgba(139,92,246,0.3)]",
  },
];

interface WeightSliderProps {
  contentWeight: number;
  collaborativeWeight: number;
  onChange: (vals: number[]) => void;
}

export function WeightSlider({ contentWeight, collaborativeWeight, onChange }: WeightSliderProps) {
  const [activePreset, setActivePreset] = useState<PresetMode>("balanced");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handlePresetClick = (preset: PresetConfig) => {
    setActivePreset(preset.id);
    // Notify parent with collaborative weight as slider value (0-100)
    onChange([preset.collabWeight * 100]);
  };

  const handleSliderChange = (vals: number[]) => {
    const collabVal = vals[0] / 100;
    // Check if this matches any preset
    const matchingPreset = PRESETS.find(
      (p) => Math.abs(p.collabWeight - collabVal) < 0.01
    );
    setActivePreset(matchingPreset ? matchingPreset.id : "custom");
    onChange(vals);
  };

  return (
    <div className="glass-panel p-6 rounded-xl flex flex-col gap-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Recommendation Mode
            <AnimatePresence mode="wait">
              <motion.div
                key={activePreset}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {activePreset === "custom" ? (
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/20">
                    Custom
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/20">
                    Preset
                  </Badge>
                )}
              </motion.div>
            </AnimatePresence>
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Choose how recommendations are generated
          </p>
        </div>
      </div>

      {/* Preset Mode Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((preset) => {
          const isActive = activePreset === preset.id;
          return (
            <motion.button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                isActive
                  ? `${preset.bgClass} ${preset.borderClass} ${preset.glowClass}`
                  : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10"
              }`}
            >
              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="preset-indicator"
                  className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${preset.bgClass.replace('/10', '/80')}`}
                  style={{
                    backgroundColor:
                      preset.id === "sound-alike"
                        ? "rgb(6 182 212 / 0.8)"
                        : preset.id === "balanced"
                        ? "rgb(30 215 96 / 0.8)"
                        : "rgb(139 92 246 / 0.8)",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}

              <div className={`${isActive ? preset.accentClass : "text-zinc-500"} transition-colors`}>
                {preset.icon}
              </div>
              <span className={`text-xs font-semibold tracking-wide ${isActive ? "text-white" : "text-zinc-400"} transition-colors`}>
                {preset.label}
              </span>
              <span className={`text-[10px] leading-tight ${isActive ? "text-zinc-400" : "text-zinc-600"} transition-colors`}>
                {preset.description}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Weight Display Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, rgb(6 182 212) 0%, rgb(30 215 96) 50%, rgb(139 92 246) 100%)",
            }}
            animate={{ width: `${contentWeight * 100}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          />
        </div>
        <div className="flex gap-3 text-xs font-mono shrink-0">
          <span className="text-cyan-400">{(contentWeight * 100).toFixed(0)}%</span>
          <span className="text-zinc-600">/</span>
          <span className="text-secondary">{(collaborativeWeight * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Fine Tune Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors self-start cursor-pointer"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span className="font-medium">Fine Tune</span>
        <motion.div
          animate={{ rotate: showAdvanced ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.div>
      </button>

      {/* Advanced Slider (Collapsible) */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 pt-2 border-t border-white/5">
              <Slider
                value={[collaborativeWeight * 100]}
                max={100}
                step={1}
                onValueChange={handleSliderChange}
                className="py-4"
              />
              <div className="flex justify-between text-sm font-medium">
                <div className="flex flex-col gap-1">
                  <span className="text-cyan-400 text-xs">Content (Acoustic)</span>
                  <span className="text-xl font-bold text-white">
                    {(contentWeight * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex flex-col gap-1 text-right">
                  <span className="text-secondary text-xs">Collaborative (Users)</span>
                  <span className="text-xl font-bold text-white">
                    {(collaborativeWeight * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
