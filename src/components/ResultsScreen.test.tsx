import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ResultsScreen from './ResultsScreen';
import { alice, bob, primaryRecommendation } from '../test/fixtures';

vi.mock('./MapVisualization', () => ({
  default: () => <div data-testid="map-visualization" />,
}));

describe('ResultsScreen', () => {
  it('renders the primary recommendation with AI explanation and score details', async () => {
    render(
      <ResultsScreen
        lang="en"
        recommendations={[primaryRecommendation]}
        participants={[alice, bob]}
        averageBudget={33}
        onRestart={vi.fn()}
      />,
    );

    expect(screen.getByText('Ramen House')).toBeInTheDocument();
    expect(screen.getByText(/AI explanation tailored to both diners/i)).toBeInTheDocument();
    expect(screen.getByText(/90% Match/i)).toBeInTheDocument();
    expect(await screen.findByTestId('map-visualization')).toBeInTheDocument();
  });

  it('sends a vote for the selected recommendation and prevents duplicate local submissions', async () => {
    const onVote = vi.fn().mockResolvedValue(undefined);

    render(
      <ResultsScreen
        lang="en"
        recommendations={[primaryRecommendation]}
        participants={[alice, bob]}
        averageBudget={33}
        onRestart={vi.fn()}
        onVote={onVote}
      />,
    );

    const voteButton = screen.getByRole('button', { name: /Vote/i });
    fireEvent.click(voteButton);

    await waitFor(() => expect(onVote).toHaveBeenCalledWith(0));
    expect(onVote).toHaveBeenCalledOnce();
    expect(voteButton).toBeDisabled();
    expect(screen.getByText('STORED')).toBeInTheDocument();
  });

  it('shows a recoverable empty-state when no recommendations are returned', () => {
    const onRestart = vi.fn();

    render(
      <ResultsScreen
        lang="en"
        recommendations={[]}
        participants={[alice, bob]}
        averageBudget={33}
        onRestart={onRestart}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Modify Cabin Settings/i }));
    expect(onRestart).toHaveBeenCalledOnce();
  });
});
