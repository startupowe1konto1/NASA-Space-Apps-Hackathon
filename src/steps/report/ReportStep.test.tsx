import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { t } from '../../app/i18n';
import { useAppStore } from '../../app/store';
import type { Analysis } from '../../contracts';
import { iowaAnalysis } from '../../fixtures';
import { rotationTitle } from '../cards/RotationCard';
import { ReportStep } from './ReportStep';
import { decodeShare } from './shareLink';

function readyWith(analysis: Analysis) {
  const history = [
    { year: 2024, crop: analysis.rotations[0]!.years[0]!.crop, source: 'farmer' as const },
    { year: 2025, crop: analysis.rotations[0]!.years.at(-1)!.crop, source: 'farmer' as const },
  ];
  useAppStore.setState({
    step: 7,
    goal: 'keepSoil',
    fields: [analysis.field],
    selectedFieldId: analysis.field.id,
    cropHistory: { [analysis.field.id]: history },
    priorities: { on: ['erosion'], excludedCrops: [] },
    analysis: { status: 'ready', data: analysis },
  });
}

beforeEach(() => {
  useAppStore.getState().reset();
  vi.restoreAllMocks();
});

describe('ReportStep', () => {
  it('opens with the support sentence, then the field, goal, crops and priorities', async () => {
    readyWith(iowaAnalysis);
    render(<ReportStep />);
    const report = await screen.findByRole('region', { name: /Report for your advisor/ });
    const text = report.textContent ?? '';
    const support = text.indexOf(t('app.support'));
    expect(support).toBeGreaterThan(-1);
    expect(support).toBeLessThan(text.indexOf(iowaAnalysis.field.name));
    expect(report).toHaveTextContent(t('steps.goal.keepSoil'));
    expect(report).toHaveTextContent('2024');
    expect(report).toHaveTextContent(t('steps.priorities.erosion'));
  });

  it('lists the rotations shown for the goal, the field summary and the sources', async () => {
    readyWith(iowaAnalysis);
    render(<ReportStep />);
    await screen.findByRole('region', { name: /Report for your advisor/ });
    const cards = screen.getAllByRole('article');
    const ids = iowaAnalysis.shownByGoal.keepSoil!;
    expect(cards).toHaveLength(ids.length);
    const titles = ids.map((id) => rotationTitle(iowaAnalysis.rotations.find((r) => r.id === id)!));
    expect(cards.map((c) => within(c).getByRole('heading', { level: 2 }).textContent)).toEqual(titles);
    expect(screen.getByRole('region', { name: /This field/ })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Data sources/ })).toBeInTheDocument();
  });

  it('copies a link that holds the goal, field, crops and priorities', async () => {
    const user = userEvent.setup();
    readyWith(iowaAnalysis);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<ReportStep />);
    await user.click(await screen.findByRole('button', { name: 'Copy link' }));
    expect(await screen.findByText(/Link copied/)).toBeInTheDocument();
    const url = writeText.mock.calls[0]![0] as string;
    const s = decodeShare(url.split('#s=')[1]!);
    const st = useAppStore.getState();
    expect(s).toEqual({ goal: st.goal, field: iowaAnalysis.field, cropHistory: st.cropHistory[iowaAnalysis.field.id], priorities: st.priorities });
  });

  it('shows the link to copy by hand when the clipboard is not available', async () => {
    const user = userEvent.setup();
    readyWith(iowaAnalysis);
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    render(<ReportStep />);
    await user.click(await screen.findByRole('button', { name: 'Copy link' }));
    const box = await screen.findByRole('textbox', { name: /Link to this report/ });
    expect((box as HTMLInputElement).value).toContain('#s=');
  });

  it('prints', async () => {
    const user = userEvent.setup();
    readyWith(iowaAnalysis);
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    render(<ReportStep />);
    await user.click(await screen.findByRole('button', { name: 'Print or save as PDF' }));
    expect(print).toHaveBeenCalled();
  });

  it('asks for a field when none is selected', async () => {
    render(<ReportStep />);
    expect(await screen.findByText(/Pick a field first/)).toBeInTheDocument();
  });

  it('shows the analysis error with a retry instead of an empty report', async () => {
    useAppStore.setState({
      step: 7,
      fields: [iowaAnalysis.field],
      selectedFieldId: iowaAnalysis.field.id,
      analysis: { status: 'error', source: 'NASA POWER', reason: 'timeout' },
    });
    render(<ReportStep />);
    expect(await screen.findByRole('alert')).toHaveTextContent('NASA POWER');
  });
});
