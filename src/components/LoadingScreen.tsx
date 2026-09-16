import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain } from 'lucide-react';
import { Lang } from '../utils/i18n';

interface LoadingScreenProps {
  lang: Lang;
  onComplete: () => void;
}

const STEPS_EN = [
  'Computing real-world coordinates and geocoding traveler positions...',
  'Enforcing hard restrictions (filtering out budgets and disliked cuisines)...',
  'Aligning diets & lifestyle specifications (Vegetarian/Vegan/Halal veto analysis)...',
  'Determining specific transit durations and equitable centermost areas...',
  'Assessing flavor synergy and mutual culinary index score matrix...',
  'Integrating specific Occasion multipliers to finalize weights...',
  'Synthesizing consensus reasons and picking top recommendations...',
];

export default function LoadingScreen({ lang, onComplete }: LoadingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const STEPS = STEPS_EN;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= STEPS.length - 1) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 600);
          return prev;
        }
        return prev + 1;
      });
    }, 600); // Snappy, authentic feeling loading simulation

    return () => clearInterval(interval);
  }, [onComplete, STEPS.length]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden relative bg-dark">
      {/* Absolute green glowing atmosphere */}
      <div className="absolute w-96 h-96 bg-green/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-sm w-full space-y-8">
        {/* Animated outer ring spinner */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            className="absolute inset-0 border-4 border-green/15 border-t-green rounded-full"
          />
          <Brain className="w-10 h-10 text-green animate-pulse" />
        </div>

        {/* Display Header */}
        <div>
          <h2 className="font-display font-black text-2xl text-white tracking-tight">
            MeetEat Analyzing
          </h2>
          <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
            Simultaneously merging origins across 30+ high-quality spots...
          </p>
        </div>

        {/* Checklist steps */}
        <div className="space-y-2.5 bg-zinc-900/40 border border-zinc-800 p-5 rounded-3xl text-left shadow-lg">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentStep;
            const isActive = idx === currentStep;

            return (
              <div 
                key={idx}
                className={`flex items-center gap-3 py-1.5 transition-all duration-300 border-b border-zinc-800/40 last:border-0 ${
                  isDone 
                    ? 'text-green opacity-95 font-semibold' 
                    : isActive 
                      ? 'text-white font-bold' 
                      : 'text-zinc-600 opacity-55'
                }`}
              >
                {/* Visual state dots */}
                <div className="relative w-4 h-4 flex-shrink-0 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {isDone ? (
                      <motion.span 
                        key="done"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2.5 h-2.5 rounded-full bg-green"
                      />
                    ) : isActive ? (
                      <motion.span 
                        key="active"
                        animate={{ scale: [1, 1.25, 1] }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                        className="w-2.5 h-2.5 rounded-full bg-[#60a5fa]"
                      />
                    ) : (
                      <span key="pending" className="w-2 h-2 rounded-full bg-zinc-950 border border-zinc-800" />
                    )}
                  </AnimatePresence>
                </div>

                <span className="text-[11px] leading-snug transition-colors">{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
