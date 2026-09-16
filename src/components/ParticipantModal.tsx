import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Participant, TravelMode } from '../types';
import { MapPin, X, ShieldAlert } from 'lucide-react';
import { Lang, TRANSLATIONS } from '../utils/i18n';

interface ParticipantModalProps {
  lang: Lang;
  isOpen: boolean;
  onClose: () => void;
  onSave: (participant: Participant) => void | Promise<void>;
  suggestedInfo?: Partial<Participant>;
}

const CUISINES = [
  { key: 'chinese', label: '🥢 Chinese', labelEn: '🥢 Chinese' },
  { key: 'japanese', label: '🍣 Japanese', labelEn: '🍣 Japanese' },
  { key: 'italian', label: '🍕 Italian', labelEn: '🍕 Italian' },
  { key: 'indian', label: '🍛 Indian', labelEn: '🍛 Indian' },
  { key: 'korean', label: '🥩 Korean', labelEn: '🥩 Korean' },
  { key: 'thai', label: '🌶️ Thai', labelEn: '🌶️ Thai' },
  { key: 'mediterranean', label: '🫒 Mediterranean', labelEn: '🫒 Mediterranean' },
  { key: 'british', label: '🍺 British', labelEn: '🍺 British' },
  { key: 'mexican', label: '🌮 Mexican', labelEn: '🌮 Mexican' },
  { key: 'turkish', label: '🥙 Turkish', labelEn: '🥙 Turkish' },
  { key: 'vietnamese', label: '🍜 Vietnamese', labelEn: '🍜 Vietnamese' },
];

const DIETARY_LABELS = [
  { key: 'vegetarian', label: '🥦 Vegetarian', labelEn: '🥦 Vegetarian', soft: true },
  { key: 'vegan', label: '🌱 Vegan', labelEn: '🌱 Vegan', soft: true },
  { key: 'halal', label: '☪️ Halal (Strict Veto)', labelEn: '☪️ Halal (Strict Veto)', soft: false },
  { key: 'kosher', label: '✡️ Kosher (Strict Veto)', labelEn: '✡️ Kosher (Strict Veto)', soft: false },
  { key: 'gluten-free', label: '🌾 Gluten-Free', labelEn: '🌾 Gluten-Free', soft: false },
  { key: 'dairy-free', label: '🥛 Dairy-Free', labelEn: '🥛 Dairy-Free', soft: false },
  { key: 'nut-allergy', label: '🥜 Nut Allergy (Veto)', labelEn: '🥜 Nut Allergy (Veto)', soft: false },
  { key: 'shellfish', label: '🦐 Crustacean Allergy', labelEn: '🦐 Crustacean Allergy', soft: false },
  { key: 'no-alcohol', label: '🚫 Non-Alcoholic', labelEn: '🚫 Non-Alcoholic', soft: false },
];

const TRAVEL_MODES: { key: TravelMode; icon: string; label: string; labelEn: string }[] = [
  { key: 'transit', icon: '🚇', label: 'Tube/Transit', labelEn: 'Tube/Transit' },
  { key: 'walking', icon: '🚶', label: 'Walk', labelEn: 'Walk' },
  { key: 'bus', icon: '🚌', label: 'Bus', labelEn: 'Bus' },
  { key: 'cycling', icon: '🚴', label: 'Cycle', labelEn: 'Cycle' },
  { key: 'driving', icon: '🚗', label: 'Drive', labelEn: 'Drive' },
];

export default function ParticipantModal({
  lang,
  isOpen,
  onClose,
  onSave,
  suggestedInfo,
}: ParticipantModalProps) {
  const t = TRANSLATIONS[lang];
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [likes, setLikes] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [dietary, setDietary] = useState<string[]>([]);
  const [budget, setBudget] = useState(25);
  const [minRating, setMinRating] = useState(4.0);
  const [travelMode, setTravelMode] = useState<TravelMode>('transit');
  const [travelTime, setTravelTime] = useState(30);

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const previouslyFocusedElement = useRef<Element | null>(null);

  // Auto-fill suggested info when opening modal
  useEffect(() => {
    if (isOpen) {
      setName(suggestedInfo?.name || '');
      setLocation(suggestedInfo?.location || '');
      setLat(suggestedInfo?.lat || null);
      setLng(suggestedInfo?.lng || null);
      setLikes(suggestedInfo?.likes || []);
      setDislikes(suggestedInfo?.dislikes || []);
      setDietary(suggestedInfo?.dietary || []);
      setBudget(suggestedInfo?.budget || 25);
      setMinRating(suggestedInfo?.rating || 4.0);
      setTravelMode(suggestedInfo?.travelMode || 'transit');
      setTravelTime(suggestedInfo?.travelTime || 30);
      setGpsStatus('');
      setIsSaving(false);
    }
  }, [isOpen, suggestedInfo]);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElement.current = document.activeElement;
    nameInputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocusedElement.current instanceof HTMLElement) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus('⚠ Your browser does not support Geolocation');
      return;
    }
    setGpsLoading(true);
    setGpsStatus('🔄 Acquiring current GPS coordination...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setLat(latitude);
        setLng(longitude);
        setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setGpsLoading(false);
        setGpsStatus('✅ Acquired! Postcode resolved as GPS location');
      },
      () => {
        setGpsLoading(false);
        setGpsStatus('❌ Failed, please write a London postcode manually (e.g., E1 6AD)');
      },
      { timeout: 8000 }
    );
  };

  const handleToggleLike = (cuisineKey: string) => {
    if (likes.includes(cuisineKey)) {
      setLikes(likes.filter((v) => v !== cuisineKey));
    } else {
      setLikes([...likes, cuisineKey]);
      setDislikes(dislikes.filter((v) => v !== cuisineKey)); // Exclusive
    }
  };

  const handleToggleDislike = (cuisineKey: string) => {
    if (dislikes.includes(cuisineKey)) {
      setDislikes(dislikes.filter((v) => v !== cuisineKey));
    } else {
      setDislikes([...dislikes, cuisineKey]);
      setLikes(likes.filter((v) => v !== cuisineKey)); // Exclusive
    }
  };

  const handleToggleDietary = (dietKey: string) => {
    if (dietary.includes(dietKey)) {
      setDietary(dietary.filter((d) => d !== dietKey));
    } else {
      setDietary([...dietary, dietKey]);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || 'Foodie Companion';
    const finalLocation = location.trim() || 'EC1A 1BB';

    // Basic regex check to parse postcode latitude if manual helper needed, otherwise scoring will fall back
    setIsSaving(true);
    try {
      await onSave({
        id: suggestedInfo?.id || Math.random().toString(),
        name: finalName,
        location: finalLocation,
        lat: lat || 51.513,
        lng: lng || -0.136,
        likes,
        dislikes,
        dietary,
        budget,
        rating: minRating,
        travelMode,
        travelTime,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="participant-modal-title"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/60">
          <h2 id="participant-modal-title" className="font-display font-bold text-white text-base">
            {suggestedInfo?.id ? t.titleEdit : t.titleAdd}
          </h2>
          <button
            id="btn-close-participant-modal"
            type="button"
            onClick={onClose}
            aria-label="Close participant form"
            className="p-1.5 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer bg-zinc-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <form id="participant-form" onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section: Name */}
          <div className="space-y-2">
            <label htmlFor="input-participant-name" className="text-xs font-bold tracking-wider text-zinc-400 uppercase block">
              {t.name}
            </label>
            <input
              id="input-participant-name"
              ref={nameInputRef}
              type="text"
              required
              placeholder={t.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={12}
              className="w-full bg-zinc-950/40 border border-zinc-800 focus:border-green rounded-xl p-3 text-white text-sm outline-none transition-all placeholder:text-zinc-650"
            />
          </div>

          {/* Section: Location and GPS */}
          <div className="space-y-2">
            <label htmlFor="input-participant-postcode" className="text-xs font-bold tracking-wider text-zinc-400 uppercase block">
              {t.postcode}
            </label>
            <div className="flex gap-2">
              <input
                id="input-participant-postcode"
                type="text"
                placeholder={t.postcodePlaceholder}
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setLat(null);
                  setLng(null);
                }}
                className="flex-1 bg-zinc-950/40 border border-zinc-800 focus:border-green rounded-xl p-3 text-white text-sm outline-none transition-all placeholder:text-zinc-650 font-mono"
              />
              <button
                id="btn-trigger-gps"
                type="button"
                onClick={handleGPS}
                disabled={gpsLoading}
                aria-describedby={gpsStatus ? 'gps-feedback' : undefined}
                className="px-4 py-3 border border-zinc-800 hover:border-green bg-zinc-900/40 hover:bg-green/5 text-green text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 select-none"
              >
                <MapPin className="w-4 h-4" />
                <span>{gpsLoading ? 'Reading...' : '📍 GPS'}</span>
              </button>
            </div>
            {gpsStatus && (
              <span className="text-[11px] text-zinc-455 block font-medium" id="gps-feedback" role="status">
                {gpsStatus}
              </span>
            )}
          </div>

          {/* Section: Likes */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-bold tracking-wider text-zinc-400 uppercase block">
              {t.likesSelection}
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {CUISINES.map((item) => {
                const isSelected = likes.includes(item.key);
                const textDetail = item.labelEn;
                return (
                  <button
                    id={`btn-favorite-${item.key}`}
                    type="button"
                    key={item.key}
                    onClick={() => handleToggleLike(item.key)}
                    aria-pressed={isSelected}
                    className={`px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all duration-150 font-medium ${
                      isSelected
                        ? 'bg-green/12 border-green text-green'
                        : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-750'
                    }`}
                  >
                    {textDetail}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Section: Dislikes */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-bold tracking-wider text-zinc-400 uppercase block">
              {t.dislikesSelection}
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {CUISINES.map((item) => {
                const isSelected = dislikes.includes(item.key);
                const textDetail = item.labelEn.replace(/🥢|🍣|🍕|🍛|🥩|🌶️|🫒|🍺|🌮|🥙|🍜/g, '').trim();
                return (
                  <button
                    id={`btn-dislike-${item.key}`}
                    type="button"
                    key={item.key}
                    onClick={() => handleToggleDislike(item.key)}
                    aria-pressed={isSelected}
                    className={`px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all duration-150 font-medium ${
                      isSelected
                        ? 'bg-red-500/10 border-red-500 text-red-400'
                        : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {textDetail}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Section: Dietary */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-bold tracking-wider text-zinc-400 uppercase block">
              {t.dietSelection}
            </legend>
            {/* Guide Info */}
            <div className="text-[11px] p-2.5 bg-zinc-950/45 border-l-2 border-green text-zinc-400 rounded-r-lg leading-relaxed flex items-start gap-1.5 border border-zinc-800/40">
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-green" />
              <span>
                <strong>Safety Notice</strong>: Dietary restrictions like Halal or Allergies are strict veto filters to prevent any cross-contamination or bad surprises.
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DIETARY_LABELS.map((item) => {
                const isSelected = dietary.includes(item.key);
                const textDetail = item.labelEn;
                return (
                  <button
                    id={`btn-dietary-${item.key}`}
                    type="button"
                    key={item.key}
                    onClick={() => handleToggleDietary(item.key)}
                    aria-pressed={isSelected}
                    className={`px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all duration-150 font-medium ${
                      isSelected
                        ? 'bg-green/12 border-green text-green'
                        : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {textDetail}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Section: Budget */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label htmlFor="input-budget-range" className="text-xs font-bold tracking-wider text-zinc-400 uppercase block">
                {t.budget}
              </label>
              <span className="font-display font-black text-lg text-green" id="label-budget-indicator">
                £{budget}
              </span>
            </div>
            <input
              id="input-budget-range"
              type="range"
              min={10}
              max={150}
              step={5}
              value={budget}
              onChange={(e) => setBudget(parseInt(e.target.value))}
              className="w-full accent-green h-1 bg-zinc-950 rounded-lg outline-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 px-1 select-none font-mono">
              <span>£10</span>
              <span>£40</span>
              <span>£80</span>
              <span>£120</span>
              <span>£150+</span>
            </div>
          </div>

          {/* Section: Min Rating */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-bold tracking-wider text-zinc-400 uppercase block">
              Acceptable reviews rating threshold
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {[3.5, 4.0, 4.5].map((val) => {
                const isSelected = minRating === val;
                return (
                  <button
                    id={`btn-rating-bar-${val}`}
                    type="button"
                    key={val}
                    onClick={() => setMinRating(val)}
                    aria-pressed={isSelected}
                    className={`py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                        : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {val.toFixed(1)} ★ + Review
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Section: Travel Mode & travelTime */}
          <div className="space-y-4 pt-4 border-t border-zinc-800/85">
            <fieldset className="space-y-2">
              <legend className="text-xs font-bold tracking-wider text-zinc-400 uppercase block">
                {t.travelMode}
              </legend>
              <div className="grid grid-cols-5 gap-1.5">
                {TRAVEL_MODES.map((item) => {
                  const isSelected = travelMode === item.key;
                  const labelTerm = item.labelEn;
                  return (
                    <button
                      id={`btn-travel-mode-${item.key}`}
                      type="button"
                      key={item.key}
                      onClick={() => setTravelMode(item.key)}
                      aria-pressed={isSelected}
                      className={`py-2.5 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-400/10 border-blue-400 text-blue-400 font-bold'
                          : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-lg select-none">{item.icon}</span>
                      <span className="text-[9px] font-bold">{labelTerm}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <label htmlFor="input-travel-time-range" className="text-xs font-bold tracking-wider text-zinc-400 uppercase block">
                  {t.travelTime}
                </label>
                <div className="font-display font-black text-lg text-blue-300" id="label-time-indicator">
                  {travelTime} Mins
                </div>
              </div>
              <input
                id="input-travel-time-range"
                type="range"
                min={5}
                max={90}
                step={5}
                value={travelTime}
                onChange={(e) => setTravelTime(parseInt(e.target.value))}
                className="w-full accent-blue-400 h-1 bg-zinc-950 rounded-lg outline-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 px-1 select-none font-mono">
                <span>5m</span>
                <span>20m</span>
                <span>40m</span>
                <span>65m</span>
                <span>90m+</span>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex gap-3">
          <button
            id="btn-cancel-modal"
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-3 bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            {t.cancel}
          </button>
          
          <button
            id="btn-save-participant"
            form="participant-form"
            type="submit"
            disabled={isSaving}
            className="flex-2 py-3 bg-green hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-400 text-black text-xs font-display font-black rounded-xl transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] border-none"
          >
            {isSaving ? 'Saving...' : `${t.save} →`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
