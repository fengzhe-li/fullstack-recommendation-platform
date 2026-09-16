import { motion } from 'motion/react';
import { Participant, Occasion } from '../types';
import { Copy, Share2, Users, CloudRain, Clock, Sparkles, Trash2, Edit } from 'lucide-react';
import { useState } from 'react';
import { Lang, TRANSLATIONS } from '../utils/i18n';
import SwitchButton from './ui/SwitchButton';

interface RoomScreenProps {
  lang: Lang;
  participants: Participant[];
  roomCode?: string;
  currentParticipantId?: string;
  onAddParticipantClick: () => void;
  onEditParticipantClick: (index: number) => void;
  onRemoveParticipant: (index: number) => void;
  selectedOccasion: Occasion;
  onOccasionChange: (occasion: Occasion) => void;
  rainMode: boolean;
  onRainModeToggle: () => void;
  studentDiscount: boolean;
  onStudentDiscountToggle: () => void;
  onSearch: () => void;
}

// Tailored bento color array for the avatars (replaced first orange color with custom emerald green)
const COLORS = ['#10b981', '#60a5fa', '#34d399', '#f472b6', '#a78bfa'];

const OCCASIONS_LIST: { key: Occasion; icon: string }[] = [
  { key: 'casual', icon: '🍺' },
  { key: 'birthday', icon: '🎂' },
  { key: 'date', icon: '🌹' },
  { key: 'business', icon: '💼' },
  { key: 'celebration', icon: '🎉' },
];

export default function RoomScreen({
  lang,
  participants,
  roomCode,
  currentParticipantId,
  onAddParticipantClick,
  onEditParticipantClick,
  onRemoveParticipant,
  selectedOccasion,
  onOccasionChange,
  rainMode,
  onRainModeToggle,
  studentDiscount,
  onStudentDiscountToggle,
  onSearch,
}: RoomScreenProps) {
  const [copied, setCopied] = useState(false);
  const t = TRANSLATIONS[lang];
  const shareLink = roomCode ? `${window.location.origin}/room/${roomCode}` : `${window.location.origin}/`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareWhatsApp = () => {
    const textStr = `Come join my hangout! Enter your London start location and favorite cuisines: ${shareLink}`;
    const msg = encodeURIComponent(textStr);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const shareSMS = () => {
    const textStr = `Come join our hangout selection! Open: ${shareLink}`;
    const msg = encodeURIComponent(textStr);
    window.open(`sms:?body=${msg}`);
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator.share({
        title: 'MeetEat Collective Dining System',
        text: 'Fellow foodies! Enter your commuting postcode and dietary parameters to find the perfect middle spot:',
        url: shareLink,
      }).catch(() => {});
    } else {
      copyLink();
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 md:p-6 pb-24 relative z-10 space-y-6">
      
      {/* App bar logo */}
      <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
        <div className="w-9 h-9 bg-green text-black rounded-lg flex items-center justify-center font-display font-black text-sm">
          ME
        </div>
        <div>
          <h1 className="font-display font-bold text-white text-base">MeetEat Room Cabin</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{t.powering.split('·')[0]}</p>
        </div>
        <div className="ml-auto text-xs py-1 px-3 bg-green/10 border border-green/20 rounded-full text-green font-mono flex items-center gap-1.5 font-bold">
          <span className="w-2 h-2 rounded-full bg-green animate-pulse" /> {roomCode ? `ROOM ${roomCode}` : 'ROOM'}
        </div>
      </div>

      {/* Interactive alert box if empty */}
      {participants.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-green/5 border border-green/15 rounded-2xl text-xs space-y-2 leading-relaxed"
        >
          <div className="font-bold text-green flex items-center gap-1.5 uppercase tracking-wide">
            <Sparkles className="w-4 h-4 text-green" /> <strong>Sandbox Demo Prompt</strong>
          </div>
          <p className="text-zinc-400">
            Adding members will load 5 demo profiles automatically featuring distinct postal codes (E1, WC2, N1...), custom dietary restrictions, transit modes, and budget rules, showcasing our consensus-finding geocoding algorithm!
          </p>
        </motion.div>
      )}

      {/* Invite Share Widget - Bento Card */}
      <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-3.5 shadow-lg">
        <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase block">
          📎 Share and Invite Companions to Enter Their Criteria
        </span>
        
        <div className="flex gap-2 items-center">
          <div className="flex-1 bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-2.5 text-xs text-zinc-400 truncate select-all font-mono">
            {shareLink}
          </div>
          <button
            id="btn-copy-address"
            onClick={copyLink}
            className={`px-4 py-2.5 rounded-xl border font-sans text-xs font-bold cursor-pointer transition-all ${
              copied
                ? 'bg-green/10 border-green text-green'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-green hover:text-green'
            }`}
          >
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            id="btn-whatsapp-share"
            onClick={shareWhatsApp}
            className="py-2 rounded-xl border border-zinc-800/80 bg-zinc-900/20 text-zinc-400 hover:text-green hover:border-green/40 hover:bg-green/5 transition-all text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>💬</span> WhatsApp
          </button>
          
          <button
            id="btn-sms-share"
            onClick={shareSMS}
            className="py-2 rounded-xl border border-zinc-800/80 bg-zinc-900/20 text-zinc-400 hover:text-blue-400 hover:border-blue-400/40 hover:bg-blue-400/5 transition-all text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>📱</span> SMS
          </button>

          <button
            id="btn-more-share"
            onClick={shareNative}
            className="py-2 rounded-xl border border-zinc-800/80 bg-zinc-900/20 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" /> More
          </button>
        </div>
      </div>

      {/* Participants Container */}
      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <h2 className="font-display font-semibold text-white text-base">
            Companions ({participants.length})
          </h2>
          <span className="text-[10px] text-zinc-500 font-medium">
            At least 2 required to calculate center
          </span>
        </div>

        {/* List */}
        <div className="space-y-2.5">
          {participants.map((p, i) => {
            const isCurrentParticipant = p.id === currentParticipantId;
            const canManageParticipant = !currentParticipantId || isCurrentParticipant;
            const initial = p.name.charAt(0).toUpperCase();
            const color = COLORS[i % COLORS.length];
            const likesText = p.likes.length > 0 
              ? p.likes.slice(0, 2).map(l => l.toUpperCase()).join('·') 
              : 'Any Flavors';
            const dietsText = p.dietary.length > 0 
              ? p.dietary.slice(0, 2).map(d => t[d] || d).join('·') 
              : 'No Restrictions';

            const travelModeEmoji = p.travelMode === 'walking' ? '🚶' :
                                    p.travelMode === 'cycling' ? '🚲' :
                                    p.travelMode === 'transit' ? '🚇' :
                                    p.travelMode === 'bus' ? '🚌' : '🚗';
            const travelModeLabel = t[p.travelMode] || p.travelMode;

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-3.5 bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl shadow-sm"
              >
                {/* Avatar tag */}
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center font-display font-extrabold text-sm shadow-inner"
                  style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}35` }}
                >
                  {initial}
                </div>

                {/* Meta details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm truncate">{p.name}</span>
                    {isCurrentParticipant && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-green/10 text-green font-bold uppercase">
                        You
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-500 font-mono">📍 {p.location}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {likesText} • {dietsText} • Max £{p.budget} • {travelModeEmoji} {travelModeLabel} (Max {p.travelTime}m)
                  </div>
                </div>

                {/* Edit Controls */}
                <div className="flex gap-1.5">
                  <button
                    id={`btn-edit-p-${i}`}
                    onClick={() => onEditParticipantClick(i)}
                    disabled={!canManageParticipant}
                    aria-label={`Edit ${p.name}`}
                    className="p-2 border border-zinc-800/80 hover:border-green/30 text-zinc-400 hover:text-green rounded-xl transition-all cursor-pointer bg-zinc-900/20"
                    title={canManageParticipant ? 'Edit' : 'Only this browser participant can edit this entry'}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    id={`btn-remove-p-${i}`}
                    onClick={() => onRemoveParticipant(i)}
                    disabled={!canManageParticipant}
                    aria-label={`Remove ${p.name}`}
                    className="p-2 border border-zinc-800/80 hover:border-red-500/30 text-zinc-400 hover:text-red-400 rounded-xl transition-all cursor-pointer bg-zinc-900/20"
                    title={canManageParticipant ? 'Delete' : 'Only this browser participant can delete this entry'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Add trigger */}
        {participants.length < 5 && (
          <button
            id="btn-add-p-trigger"
            onClick={onAddParticipantClick}
            className="w-full py-3.5 bg-transparent hover:bg-zinc-900/40 border border-dashed border-zinc-800 hover:border-green rounded-2xl text-zinc-400 hover:text-green font-sans text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 group select-none"
          >
            <Users className="w-4 h-4 transition-transform group-hover:scale-105" />
            <span>＋ {participants.length === 0 ? 'Add First Companion' : 'Add New Companion'}</span>
          </button>
        )}
      </div>

      <div className="h-px bg-zinc-800/60" />

      {/* Global Config cards - Bento Grid Style */}
      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block mb-1">
            Hangout Profile Vibe
          </span>
          <h2 className="font-display font-semibold text-white text-base">
            {t.occasionLabel}
          </h2>
        </div>

        {/* Occasion Grid */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <label className="text-xs text-zinc-400 block font-bold">🎯 Occasion tuning coefficient multiplication factor:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {OCCASIONS_LIST.map((item) => {
              const isSelected = selectedOccasion === item.key;
              const term = t[item.key] || item.key;
              return (
                <button
                  id={`btn-occasion-${item.key}`}
                  onClick={() => onOccasionChange(item.key)}
                  key={item.key}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-green/12 border border-green text-green shadow-md shadow-green/5'
                      : 'bg-zinc-900/30 border border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-base select-none">{item.icon}</span>
                  <span>{term}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggles Container Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Rainy Mode card */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-md">
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-blue-400" />
                <span>{t.rainLabel}</span>
              </h3>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                {t.rainDesc}
              </p>
            </div>

            <div className="flex justify-between items-center border-t border-zinc-800/40 pt-2">
              <span className="text-[10px] text-zinc-500 font-mono">STATUS: {rainMode ? 'ENABLED' : 'DISABLED'}</span>
              <SwitchButton
                id="toggle-rainy"
                checked={rainMode}
                onChange={onRainModeToggle}
                label={`${t.rainLabel}: ${rainMode ? 'enabled' : 'disabled'}`}
              />
            </div>
          </div>

          {/* Open Now Filter (Converted from NUS Student Discount) */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-md">
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>{t.openNowLabel}</span>
              </h3>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                {t.openNowDesc}
              </p>
            </div>

            <div className="flex justify-between items-center border-t border-zinc-800/40 pt-2">
              <span className="text-[10px] text-zinc-500 font-mono">STATUS: {studentDiscount ? 'OPEN_ONLY' : 'ALL_SHOW'}</span>
              <SwitchButton
                id="toggle-student-discount"
                checked={studentDiscount}
                onChange={onStudentDiscountToggle}
                label={`${t.openNowLabel}: ${studentDiscount ? 'open restaurants only' : 'all restaurants'}`}
              />
            </div>
          </div>

        </div>

      </div>

      {/* Main Search Action */}
      <div className="pt-4">
        <button
          id="btn-calc-consensus"
          disabled={participants.length < 2}
          onClick={onSearch}
          className="w-full py-4 bg-green hover:bg-emerald-400 disabled:bg-zinc-900/50 disabled:border-zinc-800 disabled:text-zinc-500/70 text-black rounded-2xl font-display font-black text-base select-none cursor-pointer transition-all duration-200 shadow-xl shadow-green/10 flex items-center justify-center gap-2 group hover:scale-[1.01] active:scale-[0.99] border-none"
        >
           <span>🔍 {participants.length >= 2 ? `Calculate Center for ${participants.length} Foodies` : 'Add at least 2 companions to calculate'}</span>
        </button>
      </div>

    </div>
  );
}
