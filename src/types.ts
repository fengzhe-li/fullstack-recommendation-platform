export type TravelMode = 'transit' | 'walking' | 'bus' | 'cycling' | 'driving';

export type Occasion = 'casual' | 'birthday' | 'date' | 'business' | 'celebration';

export interface Participant {
  id: string;
  participantToken?: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  likes: string[];
  dislikes: string[];
  dietary: string[];
  budget: number;
  rating: number;
  travelMode: TravelMode;
  travelTime: number;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  cuisineKey: string; // normalized value (e.g. 'chinese', 'indian', etc.)
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviews: number;
  price: '£' | '££' | '£££' | '££££';
  averagePrice: number;
  priceRange: string;
  dietsSupported: string[]; // dietary capabilities, e.g. 'vegetarian', 'vegan', 'halal', etc.
  mapsUrl: string;
  bookUrl: string;
  emoji: string;
  occasions: Record<Occasion, number>; // scoring of suitability (1-10)
  isOpenNow?: boolean;
}

export interface TravelTimeResult {
  participantName: string;
  min: number;
  mode: TravelMode;
}

export interface ScoringBreakdown {
  geo: number;      // 0 to 30
  cuisine: number;  // 0 to 25
  quality: number;  // 0 to 15
  occasion: number; // 0 to 10
  total: number;    // 0 to 80
}

export interface RecommendationResult {
  id?: number;
  rank?: number;
  restaurant: Restaurant;
  scores: ScoringBreakdown;
  travels: TravelTimeResult[];
  reason: string;
  reasonEn?: string;
  reasonZh?: string;
  archetype: 'best' | 'close' | 'taste';
  votes: number;
  score?: number;
  aiExplanation?: string | null;
  aiProvider?: string | null;
  aiModel?: string | null;
  aiStatus?: string | null;
  aiGeneratedAt?: string | null;
}

export interface RoomRead {
  id: number;
  roomCode: string;
  title: string;
  occasion: Occasion;
  rainMode: boolean;
  openNow: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VoteCount {
  recommendationResultId: number;
  count: number;
}

export interface WinnerResponse {
  voteCounts: VoteCount[];
  winner: RecommendationResult | null;
}

export interface RoomState extends RoomRead {
  participants: Participant[];
  latestRecommendations?: {
    recommendations: RecommendationResult[];
  } | null;
  voteCounts: VoteCount[];
  winner: RecommendationResult | null;
}

export interface VoteResponse extends WinnerResponse {
  voteId: number;
}
