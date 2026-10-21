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

  it('does not show STORED or increment counts until the server confirms', async () => {
    let resolveVote!: () => void;
    const onVote = vi.fn(() => new Promise<void>((resolve) => { resolveVote = resolve; }));
    render(<ResultsScreen lang="en" recommendations={[primaryRecommendation]} participants={[alice, bob]} averageBudget={33} onRestart={vi.fn()} onVote={onVote} />);

    const voteButton = screen.getByRole('button', { name: /Vote \(0\)/i });
    fireEvent.click(voteButton);
    expect(screen.queryByText('STORED')).not.toBeInTheDocument();
    expect(screen.getByText('SAVING…')).toBeInTheDocument();

    resolveVote();
    await waitFor(() => expect(screen.getByText('STORED')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Voted \(0\)/i })).toBeDisabled();
  });

  it('shows vote failure and allows retry without incrementing confirmed votes', async () => {
    const onVote = vi.fn()
      .mockRejectedValueOnce(new Error('Not authorized'))
      .mockResolvedValueOnce(undefined);
    render(<ResultsScreen lang="en" recommendations={[primaryRecommendation]} participants={[alice, bob]} averageBudget={33} onRestart={vi.fn()} onVote={onVote} />);

    const voteButton = screen.getByRole('button', { name: /Vote \(0\)/i });
    fireEvent.click(voteButton);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Not authorized'));
    expect(screen.getByRole('button', { name: /Vote \(0\)/i })).not.toBeDisabled();
    expect(screen.queryByText('STORED')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Vote \(0\)/i }));
    await waitFor(() => expect(screen.getByText('STORED')).toBeInTheDocument());
    expect(onVote).toHaveBeenCalledTimes(2);
  });

  it('prevents duplicate submissions while a vote is pending', async () => {
    let resolveVote!: () => void;
    const onVote = vi.fn(() => new Promise<void>((resolve) => { resolveVote = resolve; }));
    render(<ResultsScreen lang="en" recommendations={[primaryRecommendation]} participants={[alice, bob]} averageBudget={33} onRestart={vi.fn()} onVote={onVote} />);

    const voteButton = screen.getByRole('button', { name: /Vote \(0\)/i });
    fireEvent.click(voteButton);
    fireEvent.click(voteButton);
    expect(onVote).toHaveBeenCalledOnce();
    resolveVote();
    await waitFor(() => expect(screen.getByText('STORED')).toBeInTheDocument());
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
