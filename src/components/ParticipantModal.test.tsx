import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ParticipantModal from './ParticipantModal';
import { alice } from '../test/fixtures';

describe('ParticipantModal', () => {
  it('uses dialog semantics and focuses the name field when opened', () => {
    render(
      <ParticipantModal
        lang="en"
        isOpen
        onClose={vi.fn()}
        onSave={vi.fn()}
        suggestedInfo={alice}
      />,
    );

    expect(screen.getByRole('dialog', { name: /Edit/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/i)).toHaveFocus();
  });

  it('closes on Escape and submits with the keyboard-accessible save button', async () => {
    const onClose = vi.fn();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <ParticipantModal
        lang="en"
        isOpen
        onClose={onClose}
        onSave={onSave}
        suggestedInfo={alice}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Lock Settings/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
