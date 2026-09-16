import { motion } from 'motion/react';
import { RecommendationResult } from '../types';
import { Sparkles, Navigation, CalendarCheck, RotateCw } from 'lucide-react';
import { Lang, TRANSLATIONS } from '../utils/i18n';

interface WinnerScreenProps {
  lang: Lang;
  winner: RecommendationResult;
  onRestart: () => void;
}

export default function WinnerScreen({ lang, winner, onRestart }: WinnerScreenProps) {
  const r = winner.restaurant;
  const t = TRANSLATIONS[lang];
  
  // Find the longest travel time required by a participant
  const maxTravelTime = Math.max(...winner.travels.map(t => t.min));
  const maxTraveler = winner.travels.find(t => t.min === maxTravelTime);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden bg-dark">
      {/* Background magical circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-green/10 rounded-full blur-[110px] pointer-events-none animate-pulse" />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="relative z-10 max-w-sm w-full space-y-6"
      >
        {/* Confetti sparkle badge */}
        <span className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-green/12 border border-green/30 text-green font-display font-bold text-xs uppercase tracking-widest select-none shadow">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>UNANIMOUS CONSENSUS</span>
        </span>

        {/* Big styled emoji card */}
        <motion.div
          animate={{ rotate: [0, -3, 3, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
          className="w-24 h-24 bg-zinc-900 border border-green/20 rounded-3xl flex items-center justify-center text-5xl mx-auto shadow-xl shadow-green/5 select-none"
        >
          {r.emoji}
        </motion.div>

        {/* Restaurant Title block */}
        <div className="space-y-1.5">
          <h1 className="font-display font-black text-3xl md:text-4xl text-white leading-tight tracking-tight">
            {r.name}
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed px-4">
            {r.cuisine} • {r.address}
          </p>
        </div>

        {/* Bento specifications grid */}
        <div className="bg-zinc-900/40 border border-zinc-805/80 p-5 rounded-3xl text-left space-y-3.5 shadow-xl">
          <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-800/40">
            <span className="text-zinc-500 font-semibold">Google Maps Review:</span>
            <span className="font-bold text-white">{r.rating} ★ ({r.reviews >= 1000 ? `${(r.reviews/1000).toFixed(1)}k` : r.reviews} reviews)</span>
          </div>

          <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-800/40">
            <span className="text-zinc-500 font-semibold">Estimated Price Reference:</span>
            <span className="font-bold text-white">£{r.averagePrice} per head (Tier {r.price})</span>
          </div>

          <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-800/40">
            <span className="text-zinc-500 font-semibold">Max Commute (Tardiest):</span>
            <span className="font-bold flex items-center gap-1.5 text-blue-300">
              <span>{maxTravelTime} Minutes ({maxTraveler?.participantName})</span>
            </span>
          </div>

          <div className="flex justify-between items-center text-xs pt-1">
            <span className="text-zinc-500 font-semibold">Unified Score Matrix:</span>
            <span className="font-display font-black text-green text-sm">{winner.scores.total} / 80 Pts</span>
          </div>
        </div>

        {/* Dynamic AI consensus justification display */}
        <div className="p-3 bg-zinc-900/30 border border-zinc-800/50 text-zinc-400 italic text-[11px] leading-relaxed rounded-xl relative">
          <span>“{winner.reason}”</span>
        </div>

        {/* Final Actions */}
        <div className="space-y-2.5 pt-2">
          <div className="flex gap-2">
            <a
              id="btn-winner-maps"
              href={r.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-4 bg-green hover:bg-emerald-400 text-black font-display font-black text-sm rounded-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow shadow-green/15 text-decoration-none border-none"
            >
              <Navigation className="w-4 h-4" />
              <span>Google Maps</span>
            </a>

            <a
              id="btn-winner-reservations"
              href={r.bookUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-4 bg-transparent hover:bg-green/5 border border-green/30 hover:border-green text-green font-sans text-sm font-semibold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 text-decoration-none"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Book Venue</span>
            </a>
          </div>

          <button
            id="btn-begin-new-hangout"
            onClick={onRestart}
            className="w-full py-3 border border-dashed border-zinc-800 hover:border-green text-zinc-500 hover:text-green font-sans text-xs flex items-center justify-center gap-1 bg-transparent cursor-pointer rounded-xl transition-all"
          >
            <RotateCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Launch New Dining Room Settings →</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
