import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RoomScreen from './RoomScreen';
import { alice, bob } from '../test/fixtures';

const defaultProps = {
  lang: 'en' as const,
  participants: [alice, bob],
  roomCode: 'ROOM42',
  currentParticipantId: alice.id,
  onAddParticipantClick: vi.fn(),
  onEditParticipantClick: vi.fn(),
  onRemoveParticipant: vi.fn(),
  selectedOccasion: 'casual' as const,
  onOccasionChange: vi.fn(),
  rainMode: false,
  onRainModeToggle: vi.fn(),
  studentDiscount: true,
  onStudentDiscountToggle: vi.fn(),
  onSearch: vi.fn(),
};

describe('RoomScreen', () => {
  it('shows the room link, participant identity, and enabled consensus action', () => {
    render(<RoomScreen {...defaultProps} />);

    expect(screen.getByText(/ROOM ROOM42/i)).toBeInTheDocument();
    expect(screen.getByText(/Alice/i)).toBeInTheDocument();
    expect(screen.getByText(/Bob/i)).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Calculate Center for 2 Foodies/i })).toBeEnabled();
  });

  it('prevents editing another participant from the current browser identity', () => {
    render(<RoomScreen {...defaultProps} />);

    expect(document.querySelector('#btn-edit-p-0')).toBeEnabled();
    expect(document.querySelector('#btn-remove-p-0')).toBeEnabled();
    expect(document.querySelector('#btn-edit-p-1')).toBeDisabled();
    expect(document.querySelector('#btn-remove-p-1')).toBeDisabled();
  });

  it('disables recommendation generation until at least two participants are present', () => {
    render(<RoomScreen {...defaultProps} participants={[alice]} />);

    expect(screen.getByRole('button', { name: /Add at least 2 companions/i })).toBeDisabled();
  });

  it('passes occasion and filter changes to parent state', () => {
    const onOccasionChange = vi.fn();
    const onRainModeToggle = vi.fn();

    render(
      <RoomScreen
        {...defaultProps}
        onOccasionChange={onOccasionChange}
        onRainModeToggle={onRainModeToggle}
      />,
    );

    fireEvent.click(document.querySelector('#btn-occasion-business') as HTMLButtonElement);
    fireEvent.click(document.querySelector('#toggle-rainy') as HTMLButtonElement);

    expect(onOccasionChange).toHaveBeenCalledWith('business');
    expect(onRainModeToggle).toHaveBeenCalledOnce();
  });
});

