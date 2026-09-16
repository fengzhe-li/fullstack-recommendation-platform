import { lazy, Suspense, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RecommendationResult, Participant, TravelMode } from '../types';
import { RotateCcw, Clock, ThumbsUp, Navigation, CalendarDays, Sparkles, Activity } from 'lucide-react';
import { Lang, TRANSLATIONS } from '../utils/i18n';
const MapVisualization = lazy(() => import('./MapVisualization'));

interface ResultsScreenProps {
  lang: Lang;
  recommendations: RecommendationResult[];
  participants: Participant[];
  averageBudget: number;
  onRestart: () => void;
  onVote?: (recommendationIndex: number) => void | Promise<void>;
}

const TRAVEL_ICONS: Record<TravelMode, string> = {
  transit: '🚇',
  walking: '🚶',
  bus: '🚌',
  cycling: '🚴',
  driving: '🚗',
};

const TRAVEL_COLORS = ['text-green font-bold', 'text-blue-300', 'text-emerald-350', 'text-pink-300', 'text-purple-305'];

export default function ResultsScreen({
  lang,
  recommendations,
  participants,
  averageBudget,
  onRestart,
  onVote,
}: ResultsScreenProps) {
  const [votes, setVotes] = useState<number[]>([0, 0, 0]);
  const [votedIdx, setVotedIdx] = useState<number | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const t = TRANSLATIONS[lang];

  const handleVote = async (index: number) => {
    const nextVotes = [...votes];
    nextVotes[index] += 1;
    setVotes(nextVotes);
    setVotedIdx(index);
    if (onVote) {
      await onVote(index);
    }
  };

  const getPercentageFill = (score: number, max: number) => {
    return `${Math.round((score / max) * 100)}%`;
  };

  // Safe checks: If no recommendations found
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden relative bg-dark">
        <div className="absolute w-96 h-96 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-sm w-full space-y-6 bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl shadow-xl">
          <span className="text-4xl select-none block">⚠️</span>
          <h2 className="font-display font-black text-2xl text-white tracking-tight">
            {t.noRecsTitle || 'No Suitable Restaurants Found'}
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {t.noRecsDesc || 'We are sorry! No spots in London matched the current set of constraints. Try relaxing some travel time or budget limitations.'}
          </p>
          <button
            onClick={onRestart}
            className="w-full py-3 bg-green hover:bg-emerald-430 text-black font-display font-bold text-sm rounded-xl cursor-pointer transition-all border-none"
          >
            {t.restartBtn || 'Adjust Settings'}
          </button>
        </div>
      </div>
    );
  }

  const primary = recommendations[0];
  const r = primary.restaurant;
  const matchPercent = Math.round((primary.scores.total / 80) * 100);

  // For Commute Chart
  const maxTime = Math.max(...primary.travels.map(t => t.min), 15);

  return (
    <div className="w-full text-white py-6 flex flex-col min-h-screen">
      {/* Header Section */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-6 border-b border-zinc-800/60 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-green text-black rounded-lg flex items-center justify-center font-display font-black text-sm">ME</div>
            <h1 className="text-xl md:text-2xl font-display font-extrabold tracking-tight text-white">MeetEat Consensus Board</h1>
          </div>
          <p className="text-zinc-500 text-xs sm:text-sm">
            {t.subTitle.replace('{count}', participants.length.toString()).replace('{avg}', Math.round(averageBudget).toString())}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 items-center w-full sm:w-auto">
          <div className="px-4 py-1.5 border border-zinc-800 rounded-full text-[10px] font-mono uppercase tracking-wider text-zinc-400 bg-zinc-950/40">
            Session: London_Dinner_{participants.length}p
          </div>
          <button
            onClick={onRestart}
            className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '10s' }} />
            <span>{t.restartBtn}</span>
          </button>
        </div>
      </header>

      {/* Main Bento Grid layout */}
      <div className="grid grid-cols-12 gap-4 flex-grow mb-8 animate-fade-in">
        
        {/* ================= solutions segment (PRIMARY + ALTERNATIVES ADJACENT) ================= */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-4">
          
          {/* Primary Recommendation Winner Card */}
          <div 
            onClick={() => setSelectedRestaurantId(primary.restaurant.id)}
            className={`bg-zinc-900/40 backdrop-blur-md text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl hover:shadow-green/5 transition-all cursor-pointer border-2 lg:h-[390px] ${
              selectedRestaurantId === primary.restaurant.id || selectedRestaurantId === null ? 'border-zinc-800/80' : 'border-transparent opacity-90'
            }`}
          >
            {/* Glowing atmosphere inside winner card - shifted from orange to green */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-green/5 rounded-full blur-[80px] pointer-events-none" />

            {/* Match Score Gauge */}
            <div className="absolute top-6 right-6 sm:top-8 sm:right-8 bg-green/10 border border-green/30 text-green px-3 py-1.5 rounded-full font-display font-black text-xs sm:text-sm tracking-wider shadow">
              {matchPercent}% Match
            </div>

            <div className="relative z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-green/90 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-green" />
                <span>{t.primarySol}</span>
              </span>
              <div className="mt-4 mb-4">
                <span className="text-4xl select-none block mb-1">{r.emoji}</span>
                <h2 className="text-2xl sm:text-4xl font-display font-black tracking-tight leading-none text-white mb-2">
                  {r.name}
                </h2>
              </div>
              
              <p className="text-sm font-medium leading-relaxed text-zinc-300 max-w-xl mb-4 italic">
                “{primary.aiExplanation || primary.reason}”
              </p>
            </div>

            <div className="relative z-10 border-t border-zinc-800/80 pt-4 mt-auto">
              <div className="grid grid-cols-2 gap-4 mb-4 pb-1">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase text-zinc-500">Cuisine & Price</span>
                  <span className="text-sm font-bold text-zinc-300">{r.cuisine} • {r.price}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase text-zinc-500">Address & Info</span>
                  <span className="text-xs font-semibold text-zinc-400 truncate max-w-[200px]" title={r.address}>{r.address}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleVote(0);
                  }}
                  disabled={votedIdx !== null}
                  className={`px-5 py-3 rounded-2xl font-display font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border-none ${
                    votedIdx === 0
                      ? 'bg-green text-black font-extrabold'
                      : votedIdx !== null
                        ? 'bg-zinc-800 text-zinc-650 opacity-60'
                        : 'bg-green hover:bg-emerald-400 text-black shadow shadow-green/20'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4 fill-current shrink-0" />
                  <span>{votedIdx === 0 ? `Voted (${votes[0]}) ✓` : `${t.voteBtn} (${votes[0]})`}</span>
                </button>

                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={r.bookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-none bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-green p-3 px-4 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 text-decoration-none"
                    title={t.bookSeat}
                  >
                    <CalendarDays className="w-4 h-4 text-green" />
                    <span>{t.bookSeat}</span>
                  </a>
                  <a
                    href={r.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-none bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-green p-3 px-4 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 text-decoration-none"
                    title={t.navigate}
                  >
                    <Navigation className="w-4 h-4 text-green" />
                    <span>{t.navigate}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Adjacent runners-up alternatives strip */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest block pl-1">
              {t.alternateSols}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Runner Up Option 02 */}
              {recommendations[1] ? (
                <div 
                  onClick={() => setSelectedRestaurantId(recommendations[1].restaurant.id)}
                  className={`bg-zinc-900/40 border rounded-3xl p-4 flex flex-col justify-between shadow-lg hover:border-green/45 transition-all text-left cursor-pointer ${
                    selectedRestaurantId === recommendations[1].restaurant.id ? 'border-green bg-zinc-900/60' : 'border-zinc-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-black text-zinc-500">02</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-green/10 text-green font-bold">
                        {Math.round((recommendations[1].scores.total / 80) * 100)}%
                      </span>
                    </div>
                    <span className="text-xl select-none block mb-1">{recommendations[1].restaurant.emoji}</span>
                    <h4 className="font-bold text-xs text-white truncate max-w-full">
                      {recommendations[1].restaurant.name}
                    </h4>
                    <span className="text-[9px] text-zinc-500 truncate block mt-0.5">
                      {recommendations[1].restaurant.cuisine} • {recommendations[1].restaurant.price}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleVote(1);
                    }}
                    disabled={votedIdx !== null}
                    className={`mt-2.5 text-[9px] font-bold py-1.5 px-2.5 rounded-lg border w-full flex items-center justify-center gap-1.5 transition-all ${
                      votedIdx === 1
                        ? 'bg-green text-black border-green'
                        : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-750'
                    }`}
                  >
                    <ThumbsUp className="w-2.5 h-2.5 fill-current" />
                    <span>{votedIdx === 1 ? 'Vote ✓' : `${t.voteBtn} (${votes[1]})`}</span>
                  </button>
                </div>
              ) : (
                <div className="bg-zinc-900/10 border border-zinc-800 border-dashed rounded-3xl p-5 flex items-center justify-center text-zinc-650 text-[10px] uppercase font-bold text-center">
                  Void Solution 02
                </div>
              )}

              {/* Runner Up Option 03 */}
              {recommendations[2] ? (
                <div 
                  onClick={() => setSelectedRestaurantId(recommendations[2].restaurant.id)}
                  className={`bg-zinc-900/40 border rounded-3xl p-4 flex flex-col justify-between shadow-lg hover:border-green/45 transition-all text-left cursor-pointer ${
                    selectedRestaurantId === recommendations[2].restaurant.id ? 'border-green bg-zinc-900/60' : 'border-zinc-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-black text-zinc-500">03</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-green/10 text-green font-bold">
                        {Math.round((recommendations[2].scores.total / 80) * 100)}%
                      </span>
                    </div>
                    <span className="text-xl select-none block mb-1">{recommendations[2].restaurant.emoji}</span>
                    <h4 className="font-bold text-xs text-white truncate max-w-full">
                      {recommendations[2].restaurant.name}
                    </h4>
                    <span className="text-[9px] text-zinc-500 truncate block mt-0.5">
                      {recommendations[2].restaurant.cuisine} • {recommendations[2].restaurant.price}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleVote(2);
                    }}
                    disabled={votedIdx !== null}
                    className={`mt-2.5 text-[9px] font-bold py-1.5 px-2.5 rounded-lg border w-full flex items-center justify-center gap-1.5 transition-all ${
                      votedIdx === 2
                        ? 'bg-green text-black border-green'
                        : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-750'
                    }`}
                  >
                    <ThumbsUp className="w-2.5 h-2.5 fill-current" />
                    <span>{votedIdx === 2 ? 'Vote ✓' : `${t.voteBtn} (${votes[2]})`}</span>
                  </button>
                </div>
              ) : (
                <div className="bg-zinc-900/10 border border-zinc-800 border-dashed rounded-3xl p-5 flex items-center justify-center text-zinc-650 text-[10px] uppercase font-bold text-center">
                  Void Solution 03
                </div>
              )}

              {/* Backend-authoritative voting status block */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-4 flex flex-col justify-between shadow-lg">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-green animate-pulse" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Consensus Vote</span>
                </div>
                <div className="my-2 space-y-1">
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>Status</span>
                    <span className="font-bold text-green">{votedIdx === null ? 'READY' : 'STORED'}</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: '100%' }}
                      animate={{ width: votedIdx === null ? '100%' : '100%' }}
                      transition={{ duration: 1, ease: 'linear' }}
                      className="h-full bg-green rounded-full"
                    />
                  </div>
                </div>
                <button
                  onClick={() => void handleVote(0)}
                  className="w-full py-1.5 border border-dashed border-green/30 hover:border-green text-green hover:bg-green/5 text-[9px] font-bold rounded-lg transition-all cursor-pointer"
                >
                  Lock Primary Destination →
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* ================= right geographic / metadata context segment ================= */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
          
          {/* Geocentric Radar Map (Highly interactive) */}
          <div className="flex flex-col flex-1">
            <Suspense
              fallback={
                <div className="min-h-[320px] bg-zinc-900/40 border border-zinc-800 rounded-3xl flex items-center justify-center text-xs text-zinc-500">
                  Loading map context...
                </div>
              }
            >
              <MapVisualization
                participants={participants}
                recommendations={recommendations}
                selectedRestaurantId={selectedRestaurantId}
                onSelectRestaurant={setSelectedRestaurantId}
              />
            </Suspense>
          </div>

          {/* Sub Panels - Companions preferred profiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Participant Preference List */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-4 flex flex-col justify-between shadow-lg">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">PARTICIPANTS</span>
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 border-b border-zinc-800/20 pb-1.5">Companion Departure</h3>
                
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1" tabIndex={0} aria-label="Participant travel summary">
                  {participants.map((p, i) => {
                    const pTravel = primary.travels.find(t => t.participantName === p.name);
                    return (
                      <div key={p.id} className="p-2 bg-zinc-950/40 rounded-xl border border-zinc-850 flex flex-col gap-0.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-white flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-green" /> {p.name}
                          </span>
                          {pTravel && (
                            <span className="text-[8px] text-zinc-400 font-mono">
                              {TRAVEL_ICONS[pTravel.mode]} {pTravel.min}m
                            </span>
                          )}
                        </div>
                        <div className="text-[8px] text-zinc-500 truncate">
                          £{p.budget} • {p.likes.slice(0, 1).map(l => t[l] || l).join('') || 'Generic'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Score matrix breakdown */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-4 flex flex-col justify-between shadow-lg">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">DECISION MATRIX</span>
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 border-b border-zinc-800/20 pb-1.5">{t.decisionMatrix}</h4>
              </div>

              <div className="space-y-1.5 text-[9px]">
                <div>
                  <div className="flex justify-between text-zinc-400">
                    <span>{t.fairness}</span>
                    <span className="font-mono">{primary.scores.geo} / 30</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-green rounded-full" style={{ width: getPercentageFill(primary.scores.geo, 30) }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-zinc-400">
                    <span>{t.match}</span>
                    <span className="font-mono">{primary.scores.cuisine} / 25</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-green rounded-full" style={{ width: getPercentageFill(primary.scores.cuisine, 25) }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-zinc-400">
                    <span>{t.quality}</span>
                    <span className="font-mono">{primary.scores.quality} / 15</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-green/75" style={{ width: getPercentageFill(primary.scores.quality, 15) }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-zinc-400">
                    <span>{t.matchOccasion}</span>
                    <span className="font-mono">{primary.scores.occasion} / 10</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-green/55" style={{ width: getPercentageFill(primary.scores.occasion, 10) }} />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Travel Commute Timeline Grid card */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-4 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.commuteTimeLine}</span>
              <Activity className="w-3.5 h-3.5 text-green" />
            </div>

            <div className="relative h-10 w-full mt-3 mb-1 bg-zinc-950/40 rounded-xl px-2 border border-zinc-850">
              <div className="absolute w-[92%] h-[1px] bg-zinc-800 top-1/2 left-4 -translate-y-1/2 rounded-full" />
              
              {primary.travels.map((travelItem, idx) => {
                const pct = `${Math.min(88, Math.max(10, (travelItem.min / maxTime) * 100))}%`;
                return (
                  <div
                    key={idx}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group flex flex-col items-center"
                    style={{ left: pct, top: '50%' }}
                  >
                    <div
                      className="w-6 h-6 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs shadow cursor-help"
                      title={`${travelItem.participantName}: ${travelItem.min}m (${travelItem.mode})`}
                    >
                      {TRAVEL_ICONS[travelItem.mode]}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center text-[9px] text-zinc-500 font-semibold pt-1">
              <span>{t.fastest}: {Math.min(...primary.travels.map(t => t.min))}m</span>
              <span>{t.slowest}: {maxTime}m</span>
            </div>
          </div>

        </div>

      </div>

      {/* Footer statistics context */}
      <footer className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-zinc-800/40 pt-4 text-[10px] text-zinc-650">
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10b981]" />
          <span>30+ handpicked premium London food hubs fully computed</span>
          <span>&bull;</span>
          <span>Transit penalty matrix applied</span>
        </div>
        <div className="font-mono">DECISION_ENGINE_V3.0_STABLE</div>
      </footer>
    </div>
  );
}
