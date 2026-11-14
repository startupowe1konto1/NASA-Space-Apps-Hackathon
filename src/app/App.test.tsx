import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { demoFields } from '../fixtures';
import terms from '../steps/glossary/terms.en.json';
import { App } from './App';
import { PROJECT_NAME } from './brand';
import { setLang, t, textFor } from './i18n';
import en from './messages/en.json';
import pl from './messages/pl.json';
import { STEP_COUNT, useAppStore } from './store';

// These tests check the step shell, so they run on the fixture analysis whatever engine providers.ts points at.
vi.mock('./providers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./providers')>();
  const { fixtureAnalyzeField } = await import('../fixtures');
  return { ...actual, analyzeField: fixtureAnalyzeField };
});

type Key = keyof typeof en;
const heading = (lang: 'en' | 'pl', n: number, key: Key) =>
  `${textFor('app.stepOf', lang, { n, total: STEP_COUNT })}: ${(lang === 'en' ? en : pl)[key]}`;

beforeEach(() => {
  useAppStore.getState().reset();
});

describe('start page (step 0)', () => {
  afterEach(() => setLang('en'));

  it('opens on the app name, a short description and a Start button, with no step heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(PROJECT_NAME);
    expect(screen.getByText(en['app.intro.text' as Key])).toBeInTheDocument();
    expect(screen.getByRole('button', { name: en['app.intro.start' as Key] })).toBeInTheDocument();
    expect(screen.queryByText(/Step 1 of/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: en['app.next'] })).not.toBeInTheDocument();
  });

  it('shows the description in Polish', async () => {
    render(<App />);
    setLang('pl');
    expect(await screen.findByText(pl['app.intro.text' as Key])).toBeInTheDocument();
    expect(screen.getByRole('button', { name: pl['app.intro.start' as Key] })).toBeInTheDocument();
  });

  it('goes to step 1, the field, on Start', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: en['app.intro.start' as Key] }));
    expect(await screen.findByRole('heading', { level: 1, name: heading('en', 1, 'app.step.field') })).toBeInTheDocument();
  });

  it('comes back from step 1 with Back and keeps the field', async () => {
    const user = userEvent.setup();
    useAppStore.getState().addField(demoFields.iowa);
    useAppStore.getState().goToStep(1);
    render(<App />);
    await user.click(screen.getByRole('button', { name: en['app.back'] }));
    expect(await screen.findByRole('button', { name: en['app.intro.start' as Key] })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: en['app.intro.start' as Key] }));
    expect(await screen.findByRole('heading', { level: 1, name: heading('en', 1, 'app.step.field') })).toBeInTheDocument();
    expect(useAppStore.getState().selectedFieldId).toBe(demoFields.iowa.id);
  });

  it('opens an old share link (#s=...) on the start page', () => {
    window.history.replaceState(null, '', '/#s=abc');
    try {
      render(<App />);
      expect(screen.getByRole('button', { name: en['app.intro.start' as Key] })).toBeInTheDocument();
      expect(useAppStore.getState().step).toBe(0);
    } finally {
      window.history.replaceState(null, '', '/');
    }
  });
});

describe('step order', () => {
  it('has one progress mark per step and no report step', () => {
    useAppStore.getState().goToStep(1);
    render(<App />);
    const marks = within(screen.getByRole('list', { name: en['app.progress'] })).getAllByRole('listitem');
    expect(marks).toHaveLength(STEP_COUNT);
    expect(screen.queryByText('Report for your advisor')).not.toBeInTheDocument();
  });

  it('puts the goal after the field', async () => {
    const user = userEvent.setup();
    useAppStore.getState().addField(demoFields.iowa);
    useAppStore.getState().goToStep(1);
    render(<App />);
    await user.click(screen.getByRole('button', { name: en['app.next'] }));
    expect(await screen.findByRole('heading', { level: 1, name: heading('en', 2, 'app.step.goal') })).toBeInTheDocument();
  });
});

describe('step shell on fixtures', () => {
  it('walks the Iowa demo field from the field to the rotation cards', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Start' }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(`Step 1 of ${STEP_COUNT}`);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: demoFields.iowa.name }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await user.click(screen.getByRole('radio', { name: /Improve my soil/ }));
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
    await user.click(screen.getByRole('button', { name: 'Start' }));
    await user.click(screen.getByRole('button', { name: demoFields.poznan.name }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    // Poland has no satellite crop history, so the farmer picks two seasons in the crop picker (O2-B2).
    const pickers = await screen.findAllByRole('radiogroup', { name: /Main crop in/ });
    await user.click(within(pickers[0]!).getAllByRole('radio')[0]!);
    await user.click(within(pickers[1]!).getAllByRole('radio')[1]!);
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

describe('glossary link', () => {
  it('opens the glossary from the header and goes back to the same step', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Start' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(`Step 1 of ${STEP_COUNT}`);

    const link = screen.getByRole('button', { name: 'Glossary' });
    await user.click(link);
    expect(await screen.findByRole('heading', { name: 'Words used in this tool' })).toHaveFocus();
    expect(await screen.findByText(terms['soil-wetness-index'].explanation)).toBeInTheDocument();
    expect(link).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
    // The step stays mounted but hidden, so its local state (the map view) survives.
    expect(screen.queryByRole('button', { name: demoFields.iowa.name })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: demoFields.iowa.name, hidden: true })).not.toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Back to step 1' }));
    expect(await screen.findByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(screen.queryByText('Words used in this tool')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(`Step 1 of ${STEP_COUNT}`);
    expect(screen.getByRole('button', { name: demoFields.iowa.name })).toBeVisible();
    expect(link).toHaveFocus();
  });

  it('closes the glossary with Escape and returns focus to the link', async () => {
    const user = userEvent.setup();
    useAppStore.getState().goToStep(1);
    render(<App />);
    const link = screen.getByRole('button', { name: 'Glossary' });
    await user.click(link);
    expect(await screen.findByRole('heading', { name: 'Words used in this tool' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(await screen.findByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(screen.queryByText('Words used in this tool')).not.toBeInTheDocument();
    expect(link).toHaveAttribute('aria-expanded', 'false');
    expect(link).toHaveFocus();
  });

  it('opens with the keyboard', async () => {
    const user = userEvent.setup();
    render(<App />);
    screen.getByRole('button', { name: 'Glossary' }).focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('heading', { name: 'Words used in this tool' })).toBeInTheDocument();
  });
});

describe('language switch', () => {
  afterEach(() => {
    setLang('en');
  });

  it('switches the shell to Polish and back without losing the field or the step', async () => {
    const user = userEvent.setup();
    useAppStore.getState().addField(demoFields.poznan);
    useAppStore.getState().goToStep(1);
    const before = useAppStore.getState();
    render(<App />);
    const group = screen.getByRole('group', { name: en['app.language'] });
    const english = within(group).getByRole('button', { name: en['app.lang.en'] });
    const polish = within(group).getByRole('button', { name: pl['app.lang.pl'] });
    expect(english).toHaveAttribute('aria-pressed', 'true');
    expect(polish).toHaveAttribute('aria-pressed', 'false');

    await user.click(polish);
    expect(await screen.findByRole('heading', { level: 1, name: heading('pl', 1, 'app.step.field') })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: pl['app.language'] })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: pl['app.glossary'] })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: pl['app.back'] })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: pl['app.next'] })).toBeInTheDocument();
    expect(polish).toHaveAttribute('aria-pressed', 'true');
    expect(english).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement.lang).toBe('pl');
    const after = useAppStore.getState();
    expect(after.step).toBe(1);
    expect(after.fields).toBe(before.fields);
    expect(after.selectedFieldId).toBe(demoFields.poznan.id);

    await user.click(english);
    expect(await screen.findByRole('heading', { level: 1, name: heading('en', 1, 'app.step.field') })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: en['app.glossary'] })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });
});

describe('t', () => {
  it('fills parameters and shows an unknown code as-is', () => {
    expect(t('app.stepOf', { n: 2, total: 6 })).toBe('Step 2 of 6');
    expect(t({ code: 'no.such.code' })).toBe('no.such.code');
  });
});

describe('print', () => {
  it('keeps the header and the back/next bar out of print', () => {
    useAppStore.getState().goToStep(1);
    render(<App />);
    expect(screen.getByRole('banner')).toHaveClass('print:hidden');
    expect(screen.getByRole('contentinfo')).toHaveClass('print:hidden');
  });
});
