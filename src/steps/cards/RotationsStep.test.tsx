import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { t } from '../../app/i18n';
import { useAppStore } from '../../app/store';
import { cropName } from '../shared/cropName';
import { term } from '../glossary/useTerm';
import type { Analysis, RotationOption } from '../../contracts';
import { iowaAnalysis, poznanAnalysis } from '../../fixtures';
import { RotationCard } from './RotationCard';
import { RotationsStep } from './RotationsStep';

const SUPPORT = /This is decision support\./;

function readyWith(analysis: Analysis, goal: 'keepSoil' | 'improveSoil' | 'income' = 'keepSoil') {
  useAppStore.setState({
    step: 5,
    goal,
    fields: [analysis.field],
    selectedFieldId: analysis.field.id,
    analysis: { status: 'ready', data: analysis },
  });
}

const current = (a: Analysis) => a.rotations.find((r) => r.isCurrent)!;
const cardTitles = () => screen.getAllByRole('article').map((a) => within(a).getByRole('heading', { level: 2 }).textContent);

beforeEach(() => {
  useAppStore.getState().reset();
});

describe('RotationCard', () => {
  it('shows the crops, soil health and climate resilience first, the five sections and the support sentence', async () => {
    const r = current(iowaAnalysis);
    render(<RotationCard rotation={r} rank={1} goal="keepSoil" datasets={iowaAnalysis.datasets} />);
    const card = await screen.findByRole('article');
    const heading = within(card).getByRole('heading', { level: 2 });
    for (const y of r.years) expect(heading).toHaveTextContent(cropName(y.crop));
    expect(within(card).getByText('Your rotation')).toBeInTheDocument();

    const text = card.textContent ?? '';
    const soil = text.indexOf('Soil health');
    const climate = text.indexOf('Climate resilience');
    const why = text.indexOf('Why this rotation');
    expect(soil).toBeGreaterThan(-1);
    expect(climate).toBeGreaterThan(soil);
    expect(why).toBeGreaterThan(climate);

    for (const section of ['Why this rotation', 'Evidence', 'Benefits', 'What we do not know', 'Check locally']) {
      expect(within(card).getByRole('heading', { name: section })).toBeInTheDocument();
    }
    expect(within(card).getByText(SUPPORT)).toBeInTheDocument();
  });

  it('keeps gaps as the first list and local risks as the second (the e2e tests read them that way)', () => {
    const r = current(iowaAnalysis);
    render(<RotationCard rotation={r} rank={1} goal="keepSoil" datasets={iowaAnalysis.datasets} />);
    const card = screen.getByRole('article');
    const lists = within(card).getAllByRole('list');
    expect(within(lists[0]!).getAllByRole('listitem')).toHaveLength(r.gaps.length);
    expect(within(lists[1]!).getAllByRole('listitem')).toHaveLength(r.localReviewRisks.length);
    expect(within(card).getByRole('list', { name: 'What we do not know' })).toBe(lists[0]);
    expect(within(card).getByRole('list', { name: 'Check locally' })).toBe(lists[1]);
  });

  it('shows the evidence values with a source chip', () => {
    const r = current(iowaAnalysis);
    render(<RotationCard rotation={r} rank={1} goal="keepSoil" datasets={iowaAnalysis.datasets} />);
    expect(within(screen.getByRole('article')).getAllByRole('button', { name: /observed|model estimate|our calculation/ }).length).toBeGreaterThan(0);
  });

  it('puts the weak-evidence badge and the first gap at the top of a weak card', () => {
    const weak = iowaAnalysis.rotations.find((r) => r.climateResilience.confidence === 'weak')!;
    render(<RotationCard rotation={weak} rank={2} goal="keepSoil" datasets={iowaAnalysis.datasets} />);
    const card = screen.getByRole('article');
    const alert = within(card).getByTestId('weak-evidence');
    expect(alert).toHaveTextContent('Weak evidence');
    expect(alert).toHaveTextContent(t(weak.gaps[0]!));
    const text = card.textContent ?? '';
    expect(text.indexOf(alert.textContent!)).toBeLessThan(text.indexOf('Soil health'));
  });

  it('shows the reason when similar fields are not loaded', () => {
    const r: RotationOption = {
      ...current(iowaAnalysis),
      twins: { status: 'no-data', reason: { code: 'fx.twins.not-loaded' } },
    };
    render(<RotationCard rotation={r} rank={1} goal="keepSoil" datasets={iowaAnalysis.datasets} />);
    expect(screen.getByText(t({ code: 'fx.twins.not-loaded' }))).toBeInTheDocument();
  });

  it('under another goal, says where the card would rank on keeping the soil', () => {
    const r = iowaAnalysis.rotations.find((x) => x.rankByGoal.keepSoil !== x.rankByGoal.improveSoil)!;
    render(<RotationCard rotation={r} rank={r.rankByGoal.improveSoil!} goal="improveSoil" datasets={iowaAnalysis.datasets} />);
    expect(screen.getByText(new RegExp(`${r.rankByGoal.keepSoil}\\w* if you rank on keeping the soil`))).toBeInTheDocument();
  });
});

describe('RotationsStep', () => {
  it('renders four cards for both demo fields, the current one marked', async () => {
    for (const analysis of [iowaAnalysis, poznanAnalysis]) {
      readyWith(analysis);
      const { unmount } = render(<RotationsStep />);
      expect(await screen.findAllByRole('article')).toHaveLength(4);
      expect(screen.getByText('Your rotation')).toBeInTheDocument();
      unmount();
    }
  });

  it('orders the cards by the goal and reorders them on a switch without running the analysis again', async () => {
    const user = userEvent.setup();
    readyWith(iowaAnalysis);
    const run = vi.spyOn(useAppStore.getState(), 'runAnalysis');
    render(<RotationsStep />);
    await screen.findAllByRole('article');
    const keepOrder = iowaAnalysis.shownByGoal.keepSoil!;
    const improveOrder = iowaAnalysis.shownByGoal.improveSoil!;
    const titleOf = (id: string) => screen.getByTestId(`card-${id}`).querySelector('h2')!.textContent;

    expect(cardTitles()).toEqual(keepOrder.map(titleOf));
    await user.click(screen.getByRole('radio', { name: /Improve my soil/ }));
    expect(useAppStore.getState().goal).toBe('improveSoil');
    expect(cardTitles()).toEqual(improveOrder.map(titleOf));
    expect(run).not.toHaveBeenCalled();
    expect(useAppStore.getState().analysis.status).toBe('ready');
  });

  it('falls back to keeping the soil when the income goal has no data, and says so', async () => {
    readyWith(iowaAnalysis, 'income');
    render(<RotationsStep />);
    expect(await screen.findByText(/ranked on keeping the soil/)).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(4);
  });

  it('shows the field summary with sourced values', async () => {
    readyWith(iowaAnalysis);
    render(<RotationsStep />);
    const summary = await screen.findByRole('region', { name: /This field/ });
    expect(within(summary).getByText(/Drought years/)).toBeInTheDocument();
    expect(within(summary).getByText(/Slope/)).toBeInTheDocument();
    expect(within(summary).getAllByRole('button', { name: /observed|model estimate|our calculation/ }).length).toBeGreaterThan(0);
  });

  it('the summary counts drought years in the last 15 seasons and names no "highest drought month" (#105 item 3, D42)', async () => {
    readyWith(iowaAnalysis);
    render(<RotationsStep />);
    const summary = await screen.findByRole('region', { name: /This field/ });
    const years = iowaAnalysis.profile.yearly.map((y) => y.year);
    const last = Math.max(...years);
    const recent = iowaAnalysis.profile.droughtYears.filter((y) => y > last - 15).length;
    const label = within(summary).getByText(`Drought years, ${last - 14}–${last}`);
    const row = label.parentElement!;
    expect(row.querySelector('dd')!.textContent).toMatch(new RegExp(`^${recent}(?!\\d).*of 15 years`));
    expect(within(summary).queryByText(/Highest drought risk/)).toBeNull();
    expect(within(summary).getByText(/Highest heat risk/)).toBeInTheDocument();
  });

  it('a field outside the USA and Poland shows the summary and no cards', async () => {
    readyWith({ ...iowaAnalysis, rotations: [], shownByGoal: {} });
    render(<RotationsStep />);
    expect(await screen.findByText(/Crop lists exist for the USA and Poland only/)).toBeInTheDocument();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(screen.getByRole('region', { name: /This field/ })).toBeInTheDocument();
  });

  it('lists the data sources, NASA first', async () => {
    readyWith(iowaAnalysis);
    render(<RotationsStep />);
    const panel = await screen.findByRole('region', { name: /Data sources/ });
    const items = within(panel).getAllByRole('listitem');
    const nasaFlags = items.map((li) => li.getAttribute('data-nasa') === 'true');
    expect(nasaFlags[0]).toBe(true);
    expect(nasaFlags.indexOf(false)).toBeGreaterThan(nasaFlags.lastIndexOf(true));
  });

  it('shows a source error with a retry instead of an empty screen', async () => {
    useAppStore.setState({ step: 5, analysis: { status: 'error', source: 'NASA POWER', reason: 'timeout' } });
    render(<RotationsStep />);
    expect(await screen.findByRole('alert')).toHaveTextContent('NASA POWER');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('puts a calendar strip on every card', async () => {
    readyWith(iowaAnalysis);
    render(<RotationsStep />);
    for (const card of await screen.findAllByRole('article')) {
      expect(within(card).getByRole('table', { name: /calendar/i })).toBeInTheDocument();
    }
  });

  it('numbers the other rotations 1 to 3 without counting the current one', async () => {
    readyWith(iowaAnalysis);
    render(<RotationsStep />);
    await screen.findAllByRole('article');
    for (const n of [1, 2, 3]) expect(screen.getByText(`Option ${n}`)).toBeInTheDocument();
    expect(screen.queryByText('Option 4')).not.toBeInTheDocument();
  });

  it('shows why a goal score is missing, with its source', async () => {
    const base = iowaAnalysis;
    const rotations = base.rotations.map((r) => ({
      ...r,
      totals: { ...r.totals, improveSoil: { status: 'error' as const, source: 'Soil rules', reason: { code: 'fx.twins.not-loaded' } } },
    }));
    readyWith({ ...base, rotations }, 'improveSoil');
    render(<RotationsStep />);
    const alerts = await screen.findAllByRole('alert');
    expect(alerts.some((a) => /Soil rules/.test(a.textContent ?? ''))).toBe(true);
  });

  it('shows the missing reason when a hazard has no values at all', async () => {
    const reason = 'POWER has no frost days for this point.';
    const profile = {
      ...iowaAnalysis.profile,
      monthlyRisk: iowaAnalysis.profile.monthlyRisk.map((m) =>
        m.hazard === 'frost' ? { ...m, probability: { ...m.probability, value: null, missingReason: reason } } : m,
      ),
    };
    readyWith({ ...iowaAnalysis, profile });
    render(<RotationsStep />);
    const summary = await screen.findByRole('region', { name: /This field/ });
    expect(within(summary).getByText(new RegExp(reason))).toBeInTheDocument();
  });

  it('explains the terms behind the numbers with glossary tooltips, in the summary and on every card', async () => {
    readyWith(iowaAnalysis);
    render(<RotationsStep />);
    const about = (id: Parameters<typeof term>[0]) => t('ui.term.about', { label: term(id).label });
    const summary = await screen.findByRole('region', { name: /This field/ });
    for (const id of ['root-zone', 'soil-wetness-index', 'model-estimate'] as const) {
      expect(within(summary).getByRole('button', { name: about(id) })).toBeInTheDocument();
    }
    for (const card of screen.getAllByRole('article')) {
      expect(within(card).getByRole('button', { name: about('percentile-range') })).toBeInTheDocument();
    }
  });
});

