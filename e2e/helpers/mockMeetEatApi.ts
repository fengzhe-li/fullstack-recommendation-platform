import { Page } from '@playwright/test';

export const roomResponse = {
  id: 1,
  roomCode: 'ROOM42',
  title: 'London Dinner Demo',
  occasion: 'casual',
  rainMode: false,
  openNow: true,
  createdAt: '2026-08-19T12:00:00Z',
  updatedAt: '2026-08-19T12:00:00Z',
};

export const participants = [
  {
    id: '101',
    participantToken: 'token-101',
    name: 'Ming',
    location: 'E1 6RF',
    lat: 51.522,
    lng: -0.071,
    likes: ['chinese', 'japanese'],
    dislikes: [],
    dietary: [],
    budget: 25,
    rating: 4,
    travelMode: 'transit',
    travelTime: 30,
  },
  {
    id: '102',
    participantToken: 'token-102',
    name: 'Sarah',
    location: 'WC2N 5DU',
    lat: 51.508,
    lng: -0.128,
    likes: ['italian', 'mediterranean'],
    dislikes: ['chinese'],
    dietary: ['vegetarian'],
    budget: 35,
    rating: 4,
    travelMode: 'walking',
    travelTime: 20,
  },
];

export const recommendation = {
  id: 201,
  rank: 1,
  restaurant: {
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
  },
  scores: {
    geo: 28,
    cuisine: 22,
    quality: 14,
    occasion: 8,
    total: 72,
  },
  travels: [
    { participantName: 'Ming', min: 14, mode: 'transit' },
    { participantName: 'Sarah', min: 18, mode: 'walking' },
  ],
  reason: 'Balanced travel time and cuisine fit.',
  aiExplanation: 'A strong match for the group preferences.',
  aiProvider: 'z.ai',
  aiModel: 'glm',
  archetype: 'best',
  votes: 0,
};

export async function mockMeetEatApi(page: Page) {
  let participantCursor = 0;
  let recommendationRequested = false;

  await page.route('**/api/rooms', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ json: roomResponse });
      return;
    }
    await route.fallback();
  });

  await page.route('**/api/rooms/ROOM42/participants', async (route) => {
    const participant = participants[participantCursor] || {
      ...participants[participantCursor % participants.length],
      id: String(103 + participantCursor),
      participantToken: `token-${103 + participantCursor}`,
    };
    participantCursor += 1;
    await route.fulfill({ json: participant });
  });

  await page.route('**/api/rooms/ROOM42/recommendations', async (route) => {
    recommendationRequested = true;
    await route.fulfill({ json: { recommendations: [recommendation] } });
  });

  await page.route('**/api/rooms/ROOM42', async (route) => {
    await route.fulfill({
      json: {
        ...roomResponse,
        participants,
        latestRecommendations: null,
        voteCounts: [],
        winner: null,
      },
    });
  });

  await page.route('**/api/rooms/ROOM42/votes', async (route) => {
    await route.fulfill({
      json: {
        voteId: 1,
        voteCounts: [{ recommendationResultId: 201, count: 1 }],
        winner: { ...recommendation, votes: 1 },
      },
    });
  });

  return {
    wasRecommendationRequested: () => recommendationRequested,
  };
}

