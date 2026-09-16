import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  castRoomVote,
  createRoom,
  updateRoomParticipant,
} from './recommendations';
import { alice } from '../test/fixtures';

const fetchMock = vi.fn();

globalThis.fetch = fetchMock;

function jsonResponse(payload: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('recommendations API client', () => {
  afterEach(() => {
    fetchMock.mockReset();
  });

  it('creates rooms through the backend API', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        id: 1,
        roomCode: 'ROOM42',
        title: 'London Dinner',
        occasion: 'casual',
        rainMode: false,
        openNow: true,
        createdAt: '2026-08-19T12:00:00Z',
        updatedAt: '2026-08-19T12:00:00Z',
      }),
    );

    const room = await createRoom({
      title: 'London Dinner',
      occasion: 'casual',
      rainMode: false,
      openNow: true,
    });

    expect(room.roomCode).toBe('ROOM42');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/rooms',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          title: 'London Dinner',
          occasion: 'casual',
          rainMode: false,
          openNow: true,
        }),
      }),
    );
  });

  it('sends participant tokens for protected participant updates', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(alice));

    await updateRoomParticipant('101', 'secret-token', alice);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/participants/101',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          'X-Participant-Token': 'secret-token',
        }),
      }),
    );
  });

  it('sends participant tokens for vote requests', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        voteId: 7,
        voteCounts: [{ recommendationResultId: 201, count: 1 }],
        winner: null,
      }),
    );

    await castRoomVote('ROOM42', '101', 'secret-token', 201);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/rooms/ROOM42/votes',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-Participant-Token': 'secret-token',
        }),
        body: JSON.stringify({
          participantId: 101,
          recommendationResultId: 201,
        }),
      }),
    );
  });

  it('surfaces backend failure status and response body', async () => {
    fetchMock.mockResolvedValueOnce(new Response('room not found', { status: 404 }));

    await expect(
      createRoom({
        title: 'London Dinner',
        occasion: 'casual',
        rainMode: false,
        openNow: true,
      }),
    ).rejects.toThrow('MeetEat API failed with status 404: room not found');
  });
});

