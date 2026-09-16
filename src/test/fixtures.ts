import { Participant, RecommendationResult, Restaurant } from '../types';

export const alice: Participant = {
  id: '101',
  participantToken: 'alice-token',
  name: 'Alice',
  location: 'E1 6RF',
  lat: 51.522,
  lng: -0.071,
  likes: ['japanese'],
  dislikes: [],
  dietary: [],
  budget: 30,
  rating: 4,
  travelMode: 'transit',
  travelTime: 30,
};

export const bob: Participant = {
  id: '102',
  participantToken: 'bob-token',
  name: 'Bob',
  location: 'WC2N 5DU',
  lat: 51.508,
  lng: -0.128,
  likes: ['italian'],
  dislikes: [],
  dietary: ['vegetarian'],
  budget: 35,
  rating: 4,
  travelMode: 'walking',
  travelTime: 20,
};

export const restaurant: Restaurant = {
  id: 'ramen-house',
  name: 'Ramen House',
  cuisine: 'Japanese',
  cuisineKey: 'japanese',
  address: '12 Soho Street, London',
  lat: 51.513,
  lng: -0.131,
  rating: 4.6,
  reviews: 820,
  price: '££',
  averagePrice: 25,
  priceRange: '£20-30',
  dietsSupported: ['vegetarian'],
  mapsUrl: 'https://maps.example/ramen-house',
  bookUrl: 'https://book.example/ramen-house',
  emoji: '🍜',
  occasions: {
    casual: 8,
    birthday: 7,
    date: 6,
    business: 5,
    celebration: 7,
  },
  isOpenNow: true,
};

export const primaryRecommendation: RecommendationResult = {
  id: 201,
  rank: 1,
  restaurant,
  scores: {
    geo: 28,
    cuisine: 22,
    quality: 14,
    occasion: 8,
    total: 72,
  },
  travels: [
    { participantName: 'Alice', min: 14, mode: 'transit' },
    { participantName: 'Bob', min: 18, mode: 'walking' },
  ],
  reason: 'Strong local fallback reason.',
  aiExplanation: 'AI explanation tailored to both diners.',
  aiProvider: 'z.ai',
  aiModel: 'glm',
  archetype: 'best',
  votes: 0,
};

