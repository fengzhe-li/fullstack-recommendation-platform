import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Participant, RecommendationResult } from '../types';
import { Compass, HelpCircle, MapPin, Sparkles } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

interface MapVisualizationProps {
  participants: Participant[];
  recommendations: RecommendationResult[];
  selectedRestaurantId: string | null;
  onSelectRestaurant: (id: string) => void;
}

const API_KEY =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.trim() !== '';

export default function MapVisualization({
  participants,
  recommendations,
  selectedRestaurantId,
  onSelectRestaurant,
}: MapVisualizationProps) {
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // 1. Calculate Geographic Midpoint
  const midpoint = useMemo(() => {
    if (participants.length === 0) return { lat: 51.513, lng: -0.136 }; // Central Soho
    const avgLat = participants.reduce((sum, p) => sum + p.lat, 0) / participants.length;
    const avgLng = participants.reduce((sum, p) => sum + p.lng, 0) / participants.length;
    return { lat: avgLat, lng: avgLng };
  }, [participants]);

  // 2. Compute live coordinate scale bounding box for the SVG consensus canvas (Offline / Local Mode)
  const svgElements = useMemo(() => {
    if (participants.length === 0 || recommendations.length === 0) return null;

    const coordsList = [
      ...participants.map((p) => ({ lat: p.lat, lng: p.lng, type: 'participant', id: p.id, name: p.name })),
      ...recommendations.slice(0, 3).map((r) => ({
        lat: r.restaurant.lat,
        lng: r.restaurant.lng,
        type: 'restaurant',
        id: r.restaurant.id,
        name: r.restaurant.name,
        emoji: r.restaurant.emoji,
      })),
      { lat: midpoint.lat, lng: midpoint.lng, type: 'midpoint', id: 'center', name: 'Geocentric Midpoint' },
    ];

    const lats = coordsList.map((c) => c.lat);
    const lngs = coordsList.map((c) => c.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latDelta = maxLat - minLat || 0.01;
    const lngDelta = maxLng - minLng || 0.01;

    // Normalize coordinates on a 420x220 viewport with 35px padding
    const scaleX = (lng: number) => 35 + ((lng - minLng) / lngDelta) * 350;
    const scaleY = (lat: number) => 185 - ((lat - minLat) / latDelta) * 150; // invert y for SVG coordinate system

    return {
      scaleX,
      scaleY,
      minLat,
      maxLat,
      minLng,
      maxLng,
    };
  }, [participants, recommendations, midpoint]);

  const handleCopySecretKey = () => {
    navigator.clipboard.writeText('GOOGLE_MAPS_PLATFORM_KEY').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Extract the currently highlighted restaurant
  const activeRestaurant = useMemo(() => {
    const res = recommendations.find((rec) => rec.restaurant.id === selectedRestaurantId);
    return res ? res.restaurant : recommendations[0]?.restaurant;
  }, [recommendations, selectedRestaurantId]);

  if (participants.length === 0) return null;

  return (
    <div className="w-full bg-zinc-900/40 border border-zinc-800 rounded-3xl p-5 flex flex-col gap-4 shadow-lg h-full relative overflow-hidden">
      <div className="flex justify-between items-center border-b border-zinc-805/45 pb-3">
        <div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-0.5">
            Cartographic Radar
          </span>
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-green" />
            <span>Consensus Space Layout</span>
          </h4>
        </div>

        {/* Dynamic status pill & Unlock interactive maps details option */}
        <div className="flex items-center gap-2">
          {!hasValidKey && (
            <button
              onClick={() => setShowGuide(true)}
              className="text-[9px] font-semibold py-1 px-2.5 bg-green/10 border border-green/35 text-green hover:bg-green hover:text-black hover:border-green text-opacity-95 rounded-full transition-all cursor-pointer flex items-center gap-1 shadow select-none active:scale-[0.96]"
            >
              <span>🌎 Unlock Google Maps</span>
            </button>
          )}
          {hasValidKey ? (
            <span className="text-[9px] py-1 px-2.5 bg-green/10 border border-green/20 rounded-full text-green font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" /> GOOGLE GPS LIVE
            </span>
          ) : (
            <span className="text-[9px] py-1 px-2.5 bg-blue-400/10 border border-blue-400/20 rounded-full text-blue-300 font-mono flex items-center gap-1 select-none">
              📈 SPACE RESOLVED
            </span>
          )}
        </div>
      </div>

      {hasValidKey ? (
        /* --- INTEGRATED GOOGLE MAPS COMPONENT --- */
        <div className="w-full h-[240px] sm:h-[300px] rounded-2xl overflow-hidden border border-zinc-800 relative bg-zinc-950">
          <APIProvider apiKey={API_KEY} version="weekly">
            <Map
              defaultCenter={activeRestaurant ? { lat: activeRestaurant.lat, lng: activeRestaurant.lng } : midpoint}
              defaultZoom={13}
              mapId="DEMO_MAP_ID"
              style={{ width: '100%', height: '100%' }}
              disableDefaultUI={true}
              zoomControl={true}
            >
              {/* Highlight each Participant's coordinate */}
              {participants.map((p, idx) => (
                <AdvancedMarker key={p.id} position={{ lat: p.lat, lng: p.lng }} title={p.name}>
                  <div className="px-2 py-1 bg-zinc-950/90 border border-blue-400 rounded-lg shadow-lg flex items-center gap-1 text-[10px] text-white font-bold whitespace-nowrap">
                    <span>🏠</span> {p.name}
                  </div>
                </AdvancedMarker>
              ))}

              {/* Geographical Gravity Midpoint */}
              <AdvancedMarker position={midpoint} title="Geographic Consensual Midpoint">
                <div className="w-8 h-8 rounded-full bg-green/20 border-2 border-green flex items-center justify-center animate-pulse">
                  <div className="w-3.5 h-3.5 rounded-full bg-green flex items-center justify-center text-[7px] font-black text-black">
                    ◎
                  </div>
                </div>
              </AdvancedMarker>

              {/* Candidates Restaurants */}
              {recommendations.slice(0, 3).map((rec, rIdx) => {
                const r = rec.restaurant;
                const isSelected = r.id === selectedRestaurantId || (selectedRestaurantId === null && rIdx === 0);
                return (
                  <AdvancedMarker
                    key={r.id}
                    position={{ lat: r.lat, lng: r.lng }}
                    title={r.name}
                    onClick={() => onSelectRestaurant(r.id)}
                  >
                    <motion.div
                      animate={{ scale: isSelected ? 1.15 : 0.95 }}
                      className={`flex flex-col items-center cursor-pointer`}
                    >
                      <div
                        className={`px-2 py-1.5 rounded-xl border-2 font-display font-black text-xs flex items-center gap-1 bg-zinc-900 shadow-xl transition-colors ${
                          isSelected ? 'border-[#ff8c3b] text-[#ff8c3b]' : 'border-zinc-800 text-zinc-300'
                        }`}
                      >
                        <span className="text-sm select-none">{r.emoji}</span>
                        <span>{r.name}</span>
                      </div>
                      <div
                        className={`w-2 h-2 rotate-45 -mt-1 shadow-md ${
                          isSelected ? 'bg-zinc-900 border-r-2 border-b-2 border-[#ff8c3b]' : 'bg-zinc-900'
                        }`}
                      />
                    </motion.div>
                  </AdvancedMarker>
                );
              })}
            </Map>
          </APIProvider>
        </div>
      ) : (
        /* --- BEAUTIFUL LOCAL SVG CONSENSUS PLOTTER (Offline Fallback Grid) --- */
        <div className="space-y-4">
          <div className="w-full bg-zinc-950/60 border border-zinc-850 rounded-2xl overflow-hidden flex flex-col items-stretch relative">
            {/* Background mathematical grid lines to represent precision calculations */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />

            <div className="p-3 bg-zinc-900/20 border-b border-zinc-800/40 text-[10px] text-zinc-400 flex justify-between items-center">
              <span>📊 Live Consensus Vectors Plotter</span>
              <span className="font-mono text-zinc-550 text-[9px]">SOHO MIDPOINT: 51.513, -0.136</span>
            </div>

            {/* Render dynamically normalized coordinates SVG */}
            {svgElements && (
              <svg viewBox="0 0 420 220" className="w-full h-[220px] relative z-10 p-2 select-none">
                {/* 1. Grid references and coordinate vectors */}
                <line x1="35" y1="110" x2="385" y2="110" stroke="#2a2a2a" strokeWidth="1" strokeDasharray="3" />
                <line x1="210" y1="35" x2="210" y2="185" stroke="#2a2a2a" strokeWidth="1" strokeDasharray="3" />

                {/* 2. Concentric circle grids around midpoint to represent travel bands */}
                <circle
                  cx={svgElements.scaleX(midpoint.lng)}
                  cy={svgElements.scaleY(midpoint.lat)}
                  r="30"
                  fill="none"
                  stroke="#3f3f46"
                  strokeWidth="0.7"
                  strokeDasharray="2"
                />
                <circle
                  cx={svgElements.scaleX(midpoint.lng)}
                  cy={svgElements.scaleY(midpoint.lat)}
                  r="65"
                  fill="none"
                  stroke="#27272a"
                  strokeWidth="0.6"
                  strokeDasharray="4"
                />

                {/* 3. Draw lines radiating from the selected/first restaurant to each participant to emphasize geographical fairness */}
                {participants.map((p) => {
                  const restCoords = svgElements.scaleX(activeRestaurant.lng);
                  const restCoordsY = svgElements.scaleY(activeRestaurant.lat);
                  const pX = svgElements.scaleX(p.lng);
                  const pY = svgElements.scaleY(p.lat);

                  return (
                    <line
                      key={p.id}
                      x1={restCoords}
                      y1={restCoordsY}
                      x2={pX}
                      y2={pY}
                      stroke="url(#fairnessGrad)"
                      strokeWidth="1.2"
                      strokeDasharray="4"
                      className="opacity-70"
                    />
                  );
                })}

                {/* Definitions for rich color gradient line rendering */}
                <defs>
                  <linearGradient id="fairnessGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
                  </linearGradient>
                </defs>

                {/* 4. Draw the Geographic "Fairness Midpoint" center node */}
                <circle
                  cx={svgElements.scaleX(midpoint.lng)}
                  cy={svgElements.scaleY(midpoint.lat)}
                  r={8}
                  fill="#c084fc"
                  fillOpacity="0.15"
                  stroke="#c084fc"
                  strokeWidth="1"
                />
                <circle
                  cx={svgElements.scaleX(midpoint.lng)}
                  cy={svgElements.scaleY(midpoint.lat)}
                  r={3}
                  fill="#c084fc"
                />

                {/* 5. Draw Participant Coordinates */}
                {participants.map((p, idx) => {
                  const x = svgElements.scaleX(p.lng);
                  const y = svgElements.scaleY(p.lat);
                  const initials = p.name ? p.name.substring(0, 1) : '?';
                  return (
                    <g key={p.id} className="cursor-help">
                      <circle cx={x} cy={y} r="10" fill="#3b82f6" fillOpacity="0.12" stroke="#60a5fa" strokeWidth="1" />
                      <text
                        x={x}
                        y={y + 3}
                        fill="#60a5fa"
                        fontSize="9"
                        fontWeight="black font-display"
                        textAnchor="middle"
                      >
                        {initials}
                      </text>
                      <text x={x} y={y - 12} fill="#a1a1aa" fontSize="8" textAnchor="middle">
                        {p.name}
                      </text>
                    </g>
                  );
                })}

                {/* 6. Draw Candidates / Restaurants Pins */}
                {recommendations.slice(0, 3).map((rec, rIdx) => {
                  const r = rec.restaurant;
                  const x = svgElements.scaleX(r.lng);
                  const y = svgElements.scaleY(r.lat);
                  const isSelected = r.id === selectedRestaurantId || (selectedRestaurantId === null && rIdx === 0);

                  return (
                    <g key={r.id} onClick={() => onSelectRestaurant(r.id)} className="cursor-pointer">
                      {isSelected ? (
                        <>
                          <circle cx={x} cy={y} r={17} fill="#ff8c3b" fillOpacity="0.16" className="animate-pulse" />
                          <circle cx={x} cy={y} r={12} fill="#e11d48" fillOpacity="0.1" stroke="#f43f5e" strokeWidth="1.5" />
                        </>
                      ) : (
                        <circle cx={x} cy={y} r={11} fill="#18181b" stroke="#3f3f46" strokeWidth="1.2" />
                      )}
                      <text x={x} y={y + 4} fontSize={isSelected ? '12 font-sans' : '10 font-sans'} textAnchor="middle">
                        {r.emoji}
                      </text>
                      <text
                        x={x}
                        y={y + 17}
                        fill={isSelected ? '#ff8c3b' : '#a1a1aa'}
                        fontSize="8"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        textAnchor="middle"
                      >
                        {r.name.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}

            {/* Inline Legend indicator */}
            <div className="bg-zinc-950/80 p-2.5 px-4 text-[9px] text-zinc-200 flex flex-wrap gap-4 border-t border-zinc-900 justify-center">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Travelers Origins
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Geocentric Midpoint (Consensus Gravitational)
              </span>
              <span className="flex items-center gap-1">
                <span>🏮</span> Selected & Candidate Restaurants (Blinks when highlighted)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Absolute slide-up tutorial overlay sheet */}
      {showGuide && (
        <div className="absolute inset-0 bg-zinc-950/98 backdrop-blur-md rounded-3xl p-6 z-30 flex flex-col justify-between border border-zinc-805/85 animate-fade-in text-left">
          <div className="space-y-4 overflow-y-auto max-h-[90%] pr-1">
            <div className="flex justify-between items-start border-b border-zinc-900 pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="p-1 px-[7px] rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono text-[9px]">
                  KEY STATUS: SECURE_SANDBOX
                </span>
                <span className="text-zinc-300 font-bold text-xs flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                  <span>Unlock Interactive Google Maps & Routing</span>
                </span>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="w-6 h-6 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:text-white text-zinc-400 flex items-center justify-center text-xs cursor-pointer select-none"
              >
                ✕
              </button>
            </div>
            
            <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
              The application runs without a browser-exposed maps key by default. To enable interactive maps and route planning, configure a Google Maps browser key for the frontend environment.
            </p>
 
            <div className="p-3 bg-zinc-900/60 rounded-xl space-y-2 border border-zinc-850">
              <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold border-b border-zinc-900 pb-1.5">
                <span>Secret Registration Guide</span>
                <button
                  onClick={handleCopySecretKey}
                  className={`text-[9px] font-sans px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    copied ? 'bg-green/10 text-green' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {copied ? 'Copied ✓' : 'Copy Variable Name'}
                </button>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[9px] text-zinc-400 leading-relaxed">
                <li>Click the ⚙️ <strong>Settings</strong> icon in the upper right corner of the workspace.</li>
                <li>Locate the <strong>Secrets</strong> option and click <strong>Add Secret</strong>.</li>
                <li>Set the variable name to <code>GOOGLE_MAPS_PLATFORM_KEY</code> and input your Google Maps Key as the value.</li>
                <li>Press <strong>Enter</strong> to automatically rebuild and sync!</li>
              </ol>
            </div>
          </div>
 
          <button
            onClick={() => setShowGuide(false)}
            className="w-full py-2.5 bg-green hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Return to Static Plot Plotter
          </button>
        </div>
      )}
    </div>
  );
}
