import { Slider } from "./ui/slider";
import { Badge } from "./ui/badge";

interface WeightSliderProps {
  contentWeight: number;
  collaborativeWeight: number;
  onChange: (vals: number[]) => void;
}

export function WeightSlider({ contentWeight, collaborativeWeight, onChange }: WeightSliderProps) {
  return (
    <div className="glass-panel p-6 rounded-xl flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Hybrid Tuner
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/20">Live</Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Adjust the blend of algorithms</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Slider
          defaultValue={[collaborativeWeight * 100]}
          max={100}
          step={1}
          onValueChange={onChange}
          className="py-4"
        />

        <div className="flex justify-between text-sm font-medium">
          <div className="flex flex-col gap-1">
            <span className="text-cyan-400">Content (Acoustic)</span>
            <span className="text-2xl font-bold text-white">{(contentWeight * 100).toFixed(0)}%</span>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <span className="text-secondary">Collaborative (Users)</span>
            <span className="text-2xl font-bold text-white">{(collaborativeWeight * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
