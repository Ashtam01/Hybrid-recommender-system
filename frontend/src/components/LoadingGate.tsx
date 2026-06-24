import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CheckCircle, CircleDashed } from 'lucide-react';

const PIPELINE_STEPS = [
  "Resolving input row via token distance matching...",
  "Generating high-dimensional TF-IDF vectors...",
  "Parsing user interaction matrix patterns...",
  "Aligning indices & rank percentile normalization...",
  "Weighting content and user matrices..."
];

export function LoadingGate({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < PIPELINE_STEPS.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 800); // 800ms per step for cinematic effect
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="glass-panel p-8 rounded-2xl w-full max-w-xl mx-auto flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">Synthesizing Recommendations</h2>
        <p className="text-muted-foreground text-sm">Running Spotify Hybrid Pipeline</p>
      </div>

      <div className="flex flex-col gap-4">
        {PIPELINE_STEPS.map((step, index) => {
          const isActive = index === currentStep;
          const isDone = index < currentStep;

          return (
            <motion.div 
              key={step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: isDone || isActive ? 1 : 0.4, x: 0 }}
              className={`flex items-center gap-3 text-sm font-medium ${
                isDone ? 'text-primary' : isActive ? 'text-white' : 'text-muted-foreground'
              }`}
            >
              {isDone ? (
                <CheckCircle className="w-5 h-5 text-primary" />
              ) : isActive ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                  <CircleDashed className="w-5 h-5 text-secondary" />
                </motion.div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
              )}
              {step}
            </motion.div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-2">
        <motion.div 
          className="h-full bg-gradient-to-r from-primary to-secondary"
          initial={{ width: '0%' }}
          animate={{ width: `${(currentStep / PIPELINE_STEPS.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  );
}
