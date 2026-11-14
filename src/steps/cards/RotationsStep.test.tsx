import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAppStore } from '../../app/store';
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
    expect(heading).toHaveTextContent('Maize');
    expect(heading).toHaveTextContent('Soybean');
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
    const lists = within(screen.getByRole('article')).getAllByRole('list');
    expect(within(lists[0]!).getAllByRole('listitem')).toHaveLength(r.gaps.length);
    expect(within(lists[1]!).getAllByRole('listitem')).toHaveLength(r.localReviewRisks.length);
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
    const text = card.textContent ?? '';
    expect(text.indexOf(alert.textContent!)).toBeLessThan(text.indexOf('Soil health'));
  });

  it('shows the reason when similar fields are not loaded', () => {
    const r: RotationOption = {
      ...current(iowaAnalysis),
      twins: { status: 'no-data', reason: { code: 'fx.twins.not-loaded' } },
    };
    render(<RotationCard rotation={r} rank={1} goal="keepSoil" datasets={iowaAnalysis.datasets} />);
    expect(screen.getByText('Similar fields are not loaded yet.')).toBeInTheDocument();
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
});
