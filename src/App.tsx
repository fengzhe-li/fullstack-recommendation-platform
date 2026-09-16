import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Participant, Occasion, RecommendationResult } from './types';
import { resolvePostcode } from './data/restaurants';
import {
  addRoomParticipant,
  castRoomVote,
  createRoom,
  deleteRoomParticipant,
  generateRoomRecommendations,
  getRoom,
  updateRoom,
  updateRoomParticipant,
} from './api/recommendations';
import { Lang, TRANSLATIONS } from './utils/i18n';
import { Globe } from 'lucide-react';

// Screens
import LandingScreen from './components/LandingScreen';
import RoomScreen from './components/RoomScreen';
import ParticipantModal from './components/ParticipantModal';
import LoadingScreen from './components/LoadingScreen';
import ResultsScreen from './components/ResultsScreen';
import WinnerScreen from './components/WinnerScreen';
import ApiErrorBanner from './components/ApiErrorBanner';

// 5 Realistic virtual Londoners to simulate the consensus sandbox
const DEMO_PROFILES: Participant[] = [
  {
    id: 'demo-1',
    name: 'Ming',
    location: 'E1 6RF',
    lat: 51.522,
    lng: -0.071,
    likes: ['chinese', 'japanese'],
    dislikes: [],
    dietary: [],
    budget: 25,
    rating: 4.0,
    travelMode: 'transit',
    travelTime: 30,
  },
  {
    id: 'demo-2',
    name: 'Sarah',
    location: 'WC2N 5DU',
    lat: 51.508,
    lng: -0.128,
    likes: ['italian', 'mediterranean'],
    dislikes: ['chinese'],
    dietary: ['vegetarian'],
    budget: 35,
    rating: 4.0,
    travelMode: 'walking',
    travelTime: 20,
  },
  {
    id: 'demo-3',
    name: 'Arjun',
    location: 'E14 5AB',
    lat: 51.505,
    lng: -0.022,
    likes: ['indian', 'thai'],
    dislikes: [],
    dietary: ['halal'],
    budget: 20,
    rating: 3.5,
    travelMode: 'transit',
    travelTime: 30,
  },
  {
    id: 'demo-4',
    name: 'Emma',
    location: 'N1 9GU',
    lat: 51.535,
    lng: -0.101,
    likes: ['japanese', 'korean'],
    dislikes: ['indian'],
    dietary: [],
    budget: 40,
    rating: 4.5,
    travelMode: 'cycling',
    travelTime: 25,
  },
  {
    id: 'demo-5',
    name: 'Carlos',
    location: 'SE1 7PB',
    lat: 51.503,
    lng: -0.089,
    likes: ['mexican', 'mediterranean'],
    dislikes: [],
    dietary: [],
    budget: 20,
    rating: 4.0,
    travelMode: 'driving',
    travelTime: 15,
  },
];

export default function App() {
  const [lang, setLang] = useState<Lang>('en');
  const [screen, setScreen] = useState<'landing' | 'room' | 'loading' | 'results' | 'winner'>('landing');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion>('casual');
  const [rainMode, setRainMode] = useState(false);
  const [openNow, setOpenNow] = useState(true);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null);
  const [currentParticipantToken, setCurrentParticipantToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Computed Recommendations & Choice Award Status
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [winner, setWinner] = useState<RecommendationResult | null>(null);

  useEffect(() => {
    const match = window.location.pathname.match(/^\/(?:room|r)\/([A-Za-z0-9-]+)$/);
    if (!match) return;

    getRoom(match[1])
      .then((room) => {
        setRoomCode(room.roomCode);
        setParticipants(room.participants);
        setSelectedOccasion(room.occasion);
        setRainMode(room.rainMode);
        setOpenNow(room.openNow);
        setRecommendations(room.latestRecommendations?.recommendations || []);
        setWinner(room.winner);
        const storedIdentity = getStoredParticipantIdentity(room.roomCode);
        if (room.participants.some((participant) => participant.id === storedIdentity?.participantId)) {
          setCurrentParticipantId(storedIdentity.participantId);
          setCurrentParticipantToken(storedIdentity.participantToken);
        } else {
          setCurrentParticipantForRoom(room.roomCode, null, null);
        }
        setScreen('room');
      })
      .catch((error) => {
        console.error('Unable to load room', error);
        setErrorMessage(getErrorMessage(error, 'Unable to load this shared room.'));
      });
  }, []);

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message.trim()) return error.message;
    return fallback;
  };

  const pushRoomUrl = (code: string) => {
    window.history.replaceState(null, '', `/room/${code}`);
  };

  const storageKeyForRoom = (code: string) => `meeteat:${code}:participantIdentity`;

  const getStoredParticipantIdentity = (code: string) => {
    const value = window.localStorage.getItem(storageKeyForRoom(code));
    if (!value) return null;
    try {
      return JSON.parse(value) as { participantId: string; participantToken: string };
    } catch {
      return null;
    }
  };

  const setCurrentParticipantForRoom = (
    code: string,
    participantId: string | null,
    participantToken: string | null,
  ) => {
    if (participantId && participantToken) {
      window.localStorage.setItem(storageKeyForRoom(code), JSON.stringify({ participantId, participantToken }));
    } else {
      window.localStorage.removeItem(storageKeyForRoom(code));
    }
    setCurrentParticipantId(participantId);
    setCurrentParticipantToken(participantToken);
  };

  const ensureRoom = async () => {
    if (roomCode) return roomCode;

    const room = await createRoom({
      title: 'London Dinner',
      occasion: selectedOccasion,
      rainMode,
      openNow,
    });
    setRoomCode(room.roomCode);
    setCurrentParticipantId(null);
    setCurrentParticipantToken(null);
    pushRoomUrl(room.roomCode);
    return room.roomCode;
  };

  const startSandboxDemo = async () => {
    setErrorMessage(null);
    try {
      const room = await createRoom({
        title: 'London Dinner Demo',
        occasion: selectedOccasion,
        rainMode,
        openNow,
      });
      setRoomCode(room.roomCode);
      pushRoomUrl(room.roomCode);

      const persistedProfiles = await Promise.all(
        DEMO_PROFILES.map((profile) => {
          const geo = resolvePostcode(profile.location);
          return addRoomParticipant(room.roomCode, {
            ...profile,
            id: '',
            lat: geo.lat,
            lng: geo.lng,
          });
        })
      );

      setParticipants(persistedProfiles);
      setCurrentParticipantForRoom(
        room.roomCode,
        persistedProfiles[0]?.id || null,
        persistedProfiles[0]?.participantToken || null,
      );
      setWinner(null);
      setRecommendations([]);
      setScreen('room');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to start the demo room.'));
    }
  };

  const startFromScratch = async () => {
    setErrorMessage(null);
    try {
      const room = await createRoom({
        title: 'London Dinner',
        occasion: selectedOccasion,
        rainMode,
        openNow,
      });
      setRoomCode(room.roomCode);
      setCurrentParticipantForRoom(room.roomCode, null, null);
      pushRoomUrl(room.roomCode);
      setParticipants([]);
      setWinner(null);
      setRecommendations([]);
      setScreen('room');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to create a room.'));
    }
  };

  const handleOpenAddModal = () => {
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (idx: number) => {
    if (currentParticipantId && participants[idx].id !== currentParticipantId) return;
    setEditingIndex(idx);
    setIsModalOpen(true);
  };

  const handleSaveParticipant = async (p: Participant) => {
    setErrorMessage(null);
    try {
      const activeRoomCode = await ensureRoom();
      // Resolve postal postcode string to appropriate rough coordinates
      const geo = resolvePostcode(p.location);
      const updatedWithGeo = {
        ...p,
        lat: geo.lat,
        lng: geo.lng,
      };

      if (editingIndex !== null) {
        // Edit mode
        const persistedParticipant = await updateRoomParticipant(
          participants[editingIndex].id,
          currentParticipantToken || '',
          updatedWithGeo,
        );
        const list = [...participants];
        list[editingIndex] = persistedParticipant;
        setParticipants(list);
        setCurrentParticipantForRoom(activeRoomCode, persistedParticipant.id, persistedParticipant.participantToken || null);
      } else {
        // Create mode
        const persistedParticipant = await addRoomParticipant(activeRoomCode, {
          ...updatedWithGeo,
          id: '',
        });
        setParticipants([...participants, persistedParticipant]);
        setCurrentParticipantForRoom(activeRoomCode, persistedParticipant.id, persistedParticipant.participantToken || null);
      }
      setIsModalOpen(false);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to save this participant.'));
    }
  };

  const handleRemoveParticipant = async (idx: number) => {
    if (currentParticipantId && participants[idx].id !== currentParticipantId) return;
    setErrorMessage(null);
    try {
      const removedParticipantId = participants[idx].id;
      await deleteRoomParticipant(participants[idx].id, currentParticipantToken || '');
      setParticipants(participants.filter((_, i) => i !== idx));
      if (roomCode && currentParticipantId === removedParticipantId) {
        setCurrentParticipantForRoom(roomCode, null, null);
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to remove this participant.'));
    }
  };

  const startAnalysis = () => {
    setErrorMessage(null);
    setScreen('loading');
  };

  const handleLoadingComplete = async () => {
    setErrorMessage(null);
    try {
      const activeRoomCode = await ensureRoom();
      await updateRoom(activeRoomCode, {
        occasion: selectedOccasion,
        rainMode,
        openNow,
      });
      const results = await generateRoomRecommendations(activeRoomCode);

      setRecommendations(results);
      setScreen('results');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to generate recommendations.'));
      setScreen('room');
    }
  };

  const handleWinnerCrowned = (finalWinner: RecommendationResult) => {
    setWinner(finalWinner);
    setScreen('winner');
  };

  const handleVote = async (recommendationIndex: number) => {
    const recommendation = recommendations[recommendationIndex];
    const actingParticipant = participants.find((participant) => participant.id === currentParticipantId);
    if (!roomCode || !actingParticipant || !currentParticipantToken || !recommendation?.id) {
      if (recommendation) {
        setErrorMessage('Add yourself to this room before voting from this browser.');
      }
      return;
    }

    setErrorMessage(null);
    try {
      const result = await castRoomVote(roomCode, actingParticipant.id, currentParticipantToken, recommendation.id);
      setRecommendations((current) =>
        current.map((item) => {
          const count = result.voteCounts.find((voteCount) => voteCount.recommendationResultId === item.id)?.count;
          return count === undefined ? item : { ...item, votes: count };
        })
      );
      handleWinnerCrowned(result.winner || recommendation);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to store this vote.'));
    }
  };

  const handleRestart = () => {
    setParticipants([]);
    setWinner(null);
    setRecommendations([]);
    setRoomCode(null);
    setCurrentParticipantId(null);
    setCurrentParticipantToken(null);
    window.history.replaceState(null, '', '/');
    setScreen('landing');
  };

  // Prepopulate form suggestions: if they have added X people, suggest the next virtual London profile
  const nextDemoProfile = participants.length < DEMO_PROFILES.length 
    ? {
        ...DEMO_PROFILES[participants.length],
        id: undefined, // Create completely fresh IDs
      }
    : undefined;

  const currentEditingProfile = editingIndex !== null ? participants[editingIndex] : nextDemoProfile;

  // Compute local average budget for results subtitle descriptors
  const avgBudget = participants.length > 0 
    ? Math.round(participants.reduce((sum, p) => sum + p.budget, 0) / participants.length)
    : 20;

  return (
    <div className="relative min-h-screen text-[#e8f5d0] overflow-x-hidden font-sans">
      {errorMessage && <ApiErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />}

      <main>
        <AnimatePresence mode="wait">
          {screen === 'landing' && (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LandingScreen
                lang={lang}
                onStart={startFromScratch}
                onStartWithDemo={startSandboxDemo}
              />
            </motion.div>
          )}

          {screen === 'room' && (
            <motion.div key="room" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RoomScreen
                lang={lang}
                participants={participants}
                roomCode={roomCode || undefined}
                currentParticipantId={currentParticipantId || undefined}
                onAddParticipantClick={handleOpenAddModal}
                onEditParticipantClick={handleOpenEditModal}
                onRemoveParticipant={handleRemoveParticipant}
                selectedOccasion={selectedOccasion}
                onOccasionChange={setSelectedOccasion}
                rainMode={rainMode}
                onRainModeToggle={() => setRainMode(!rainMode)}
                studentDiscount={openNow}
                onStudentDiscountToggle={() => setOpenNow(!openNow)}
                onSearch={startAnalysis}
              />
            </motion.div>
          )}

          {screen === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoadingScreen
                lang={lang}
                onComplete={() => void handleLoadingComplete()}
              />
            </motion.div>
          )}

          {screen === 'results' && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-7xl mx-auto px-4 md:px-6">
              <ResultsScreen
                lang={lang}
                recommendations={recommendations}
                participants={participants}
                averageBudget={avgBudget}
                onRestart={handleRestart}
                onVote={handleVote}
              />
            </motion.div>
          )}

          {screen === 'winner' && (
            <motion.div key="winner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WinnerScreen
                lang={lang}
                winner={winner!}
                onRestart={handleRestart}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Shared Participant Modals Layer */}
      <AnimatePresence>
        {isModalOpen && (
          <ParticipantModal
            lang={lang}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveParticipant}
            suggestedInfo={currentEditingProfile}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
