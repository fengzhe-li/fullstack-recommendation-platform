import { motion } from 'motion/react';
import { ArrowRight, Zap, Sparkles, Smile } from 'lucide-react';
import { Lang, TRANSLATIONS } from '../utils/i18n';

interface LandingScreenProps {
  lang: Lang;
  onStart: () => void;
  onStartWithDemo: () => void;
}

export default function LandingScreen({ lang, onStart, onStartWithDemo }: LandingScreenProps) {
  const t = TRANSLATIONS[lang];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 text-center overflow-hidden bg-dark">
      {/* Background neon atmosphere - green accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green/10 rounded-full blur-[110px] pointer-events-none z-0 animate-pulse" />
      
      {/* Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-xl w-full"
      >
        {/* Logo Icon */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="w-16 h-16 bg-green text-black rounded-2xl flex items-center justify-center font-display font-black text-2xl mx-auto mb-6 shadow-lg shadow-green/20"
        >
          ME
        </motion.div>

        {/* Title */}
        <h1 className="font-display font-black text-5xl md:text-6xl tracking-tight leading-none mb-4 text-white">
          Meet.<br />
          <span className="text-green">Eat.</span><br />
          Consensus.
        </h1>

        {/* Subtitle */}
        <p className="text-zinc-400 text-xs sm:text-sm max-w-sm mx-auto mb-10 leading-relaxed font-sans">
          {t.tagline}
        </p>

        {/* Actions - bento cards inspired layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
          {/* Create Hangout panel */}
          <button 
            id="btn-create-hangout"
            onClick={onStart}
            className="p-5 bg-green hover:bg-emerald-400 text-black font-display font-black text-base rounded-2xl cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 group hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green/15 border-none"
          >
            <span className="text-xl">＋</span>
            <span>{t.createHangout}</span>
            <div className="text-[10px] opacity-75 font-normal tracking-wide flex items-center gap-1 font-sans">
              <span>{t.customPreferences}</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
          
          {/* Demo Sandbox panel */}
          <button 
            id="btn-demo-sandbox"
            onClick={onStartWithDemo}
            className="p-5 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-2xl cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-1.5 focus:outline-none"
          >
            <span className="text-xl select-none">✨</span>
            <span className="font-display font-bold text-base">{t.loadDemo}</span>
            <span className="text-[10px] text-zinc-500 font-sans font-medium">{t.demoDesc}</span>
          </button>
        </div>

        {/* Highlight Specs - styled perfectly as individual Bento panels */}
        <div className="grid grid-cols-3 gap-3 border-t border-zinc-800/60 pt-8 mt-4">
          <div className="bg-zinc-900/25 border border-zinc-850/50 p-4 rounded-2xl flex flex-col items-center justify-center">
            <div className="font-display font-black text-xl sm:text-2xl text-green flex items-center justify-center gap-1">
              <Zap className="w-4 h-4 shrink-0" /> 30s
            </div>
            <div className="text-[9px] text-zinc-500 mt-1 uppercase tracking-wider font-semibold">AI Synergy</div>
          </div>
          <div className="bg-zinc-900/25 border border-zinc-850/50 p-4 rounded-2xl flex flex-col items-center justify-center">
            <div className="font-display font-black text-xl sm:text-2xl text-green flex items-center justify-center gap-1">
              <Sparkles className="w-4 h-4 shrink-0" /> Multi-X
            </div>
            <div className="text-[9px] text-zinc-500 mt-1 uppercase tracking-wider font-semibold">Cross Factor</div>
          </div>
          <div className="bg-zinc-900/25 border border-zinc-850/50 p-4 rounded-2xl flex flex-col items-center justify-center">
            <div className="font-display font-black text-xl sm:text-2xl text-green flex items-center justify-center gap-1">
              <Smile className="w-4 h-4 shrink-0" /> Zero
            </div>
            <div className="text-[9px] text-zinc-500 mt-1 uppercase tracking-wider font-semibold">Zero Vetoes</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
