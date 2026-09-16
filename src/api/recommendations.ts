import {
  Occasion,
  Participant,
  RecommendationResult,
  RoomRead,
  RoomState,
  VoteResponse,
  WinnerResponse,
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

interface RecommendationRequest {
  participants: Participant[];
  occasion: Occasion;
  rainMode: boolean;
  openNow: boolean;
}

interface RecommendationResponse {
  recommendations: RecommendationResult[];
}

interface RoomCreateRequest {
  title?: string;
  occasion: Occasion;
  rainMode: boolean;
  openNow: boolean;
}

async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`MeetEat API failed with status ${response.status}: ${message}`);
  }

  return (await response.json()) as T;
}

export async function getRecommendations({
  participants,
  occasion,
  rainMode,
  openNow,
}: RecommendationRequest): Promise<RecommendationResult[]> {
  const payload = await requestJson<RecommendationResponse>('/api/recommendations', {
    method: 'POST',
    body: JSON.stringify({
      participants,
      occasion,
      rainMode,
      openNow,
    }),
  });

  return payload.recommendations;
}

export async function createRoom(payload: RoomCreateRequest): Promise<RoomRead> {
  return requestJson<RoomRead>('/api/rooms', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateRoom(roomCode: string, payload: Partial<RoomCreateRequest>): Promise<RoomRead> {
  return requestJson<RoomRead>(`/api/rooms/${roomCode}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getRoom(roomCode: string): Promise<RoomState> {
  return requestJson<RoomState>(`/api/rooms/${roomCode}`);
}

export async function addRoomParticipant(roomCode: string, participant: Participant): Promise<Participant> {
  return requestJson<Participant>(`/api/rooms/${roomCode}/participants`, {
    method: 'POST',
    body: JSON.stringify(participant),
  });
}

export async function updateRoomParticipant(
  participantId: string,
  participantToken: string,
  participant: Participant,
): Promise<Participant> {
  return requestJson<Participant>(`/api/participants/${participantId}`, {
    method: 'PATCH',
    headers: {
      'X-Participant-Token': participantToken,
    },
    body: JSON.stringify(participant),
  });
}

export async function deleteRoomParticipant(participantId: string, participantToken: string): Promise<void> {
  await requestJson<{ deleted: boolean }>(`/api/participants/${participantId}`, {
    method: 'DELETE',
    headers: {
      'X-Participant-Token': participantToken,
    },
  });
}

export async function generateRoomRecommendations(
  roomCode: string,
  useAiExplanations = true,
): Promise<RecommendationResult[]> {
  const payload = await requestJson<RecommendationResponse>(`/api/rooms/${roomCode}/recommendations`, {
    method: 'POST',
    body: JSON.stringify({
      use_ai_explanations: useAiExplanations,
    }),
  });
  return payload.recommendations;
}

export async function getLatestRoomRecommendations(roomCode: string): Promise<RecommendationResult[]> {
  const payload = await requestJson<RecommendationResponse>(`/api/rooms/${roomCode}/recommendations/latest`);
  return payload.recommendations;
}

export async function castRoomVote(
  roomCode: string,
  participantId: string,
  participantToken: string,
  recommendationResultId: number,
): Promise<VoteResponse> {
  return requestJson<VoteResponse>(`/api/rooms/${roomCode}/votes`, {
    method: 'POST',
    headers: {
      'X-Participant-Token': participantToken,
    },
    body: JSON.stringify({
      participantId: Number(participantId),
      recommendationResultId,
    }),
  });
}

export async function getRoomWinner(roomCode: string): Promise<WinnerResponse> {
  return requestJson<WinnerResponse>(`/api/rooms/${roomCode}/winner`);
}
