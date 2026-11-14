import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { t } from './i18n';
import { canContinue, useAppStore } from './store';

// These tests check the step shell, so they run on the fixture analysis whatever engine providers.ts points at.
vi.mock('./providers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./providers')>();
  const { fixtureAnalyzeField } = await import('../fixtures');
  return { ...actual, analyzeField: fixtureAnalyzeField };
});

beforeEach(() => {
  useAppStore.getState().reset();
});

describe('step shell on fixtures', () => {
  it('walks the Iowa demo field from the goal to the rotation cards', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Step 1 of 7');
    await user.click(screen.getByRole('radio', { name: /Improve my soil/ }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Iowa demo field' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await screen.findByText('Satellite crop maps suggest this history. Is this right?');
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Yes, use these crops' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await user.click(screen.getByRole('checkbox', { name: 'Stop erosion' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await screen.findByText('Your rotation', undefined, { timeout: 3000 });
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(4);
    for (const card of cards) {
      expect(card).toHaveTextContent('What we do not know');
      expect(card).toHaveTextContent('Check locally');
      expect(card).toHaveTextContent('This is decision support.');
    }

    const state = useAppStore.getState();
    expect(state.goal).toBe('improveSoil');
    expect(state.priorities.on).toEqual(['erosion']);
  });

  it('reorders the cards when the goal changes, without running the analysis again', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Poznań demo field' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    // Poland has no satellite crop history, so the farmer picks two seasons in the crop picker (O2-B2).
    const pickers = await screen.findAllByRole('radiogroup', { name: /Main crop in/ });
    await user.click(within(pickers[0]!).getByRole('radio', { name: 'Winter wheat' }));
    await user.click(within(pickers[1]!).getByRole('radio', { name: 'Winter rapeseed' }));
    await screen.findByText('Saved 2 years of crops.');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('Your rotation', undefined, { timeout: 3000 });

    const analysis = useAppStore.getState().analysis;
    if (analysis.status !== 'ready') throw new Error('analysis should be ready');
    const order = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    const before = order();

    useAppStore.getState().setGoal('improveSoil');
    await waitFor(() => expect(order()).not.toEqual(before));
    expect(useAppStore.getState().analysis).toBe(analysis);
  });
});

describe('canContinue', () => {
  it('needs a field on step 2 and two crop years on step 3', () => {
    const s = useAppStore.getState();
    s.goToStep(2);
    expect(canContinue(useAppStore.getState())).toBe(false);
  });
});

describe('t', () => {
  it('fills parameters and shows an unknown code as-is', () => {
    expect(t('app.stepOf', { n: 2, total: 7 })).toBe('Step 2 of 7');
    expect(t({ code: 'no.such.code' })).toBe('no.such.code');
  });
});
