import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { providers } from '../../app/providers';
import { canContinue, useAppStore } from '../../app/store';
import { SourceError } from '../../contracts';
import { demoFields } from '../../fixtures';
import { CropsStep, lastSeasons } from './CropsStep';

beforeEach(() => {
  useAppStore.getState().reset();
  vi.restoreAllMocks();
});

const atStep3 = (field = demoFields.iowa) => {
  useAppStore.getState().addField(field);
  useAppStore.getState().goToStep(3);
};

describe('CropsStep with a proposed history (CropScape)', () => {
  it('asks "Is this right?" with the years and crops', async () => {
    atStep3();
    render(<CropsStep />);
    expect(await screen.findByText(/Is this right\?/)).toBeInTheDocument();
    const list = screen.getByRole('list', { name: /crops on this field/i });
    expect(within(list).getByText('2025')).toBeInTheDocument();
    expect(within(list).getAllByText('Maize').length).toBeGreaterThan(0);
    expect(within(list).getAllByText('Soybean').length).toBeGreaterThan(0);
  });

  it('"Yes" stores the history with source cropscape', async () => {
    const user = userEvent.setup();
    atStep3();
    render(<CropsStep />);
    await user.click(await screen.findByRole('button', { name: /Yes, use these crops/ }));
    const stored = useAppStore.getState().cropHistory[demoFields.iowa.id] ?? [];
    expect(stored.length).toBeGreaterThanOrEqual(2);
    expect(stored.every((y) => y.source === 'cropscape')).toBe(true);
    expect(await screen.findByText(/Saved \d+ years of crops/)).toBeInTheDocument();
    expect(canContinue(useAppStore.getState())).toBe(true);
  });

  it('editing one year stores that year with source farmer', async () => {
    const user = userEvent.setup();
    atStep3();
    render(<CropsStep />);
    await user.click(await screen.findByRole('button', { name: 'Change 2025' }));
    const picker = await screen.findByRole('radiogroup', { name: /2025/ });
    await user.click(within(picker).getByRole('radio', { name: 'Winter wheat' }));
    const stored = useAppStore.getState().cropHistory[demoFields.iowa.id] ?? [];
    expect(stored.find((y) => y.year === 2025)).toEqual({ year: 2025, crop: 'winter-wheat', source: 'farmer' });
    expect(stored.find((y) => y.year === 2024)?.source).toBe('cropscape');
  });
});

describe('CropsStep without a history (most of Poland)', () => {
  it('shows the icon picker for the last three seasons', async () => {
    atStep3(demoFields.poznan);
    render(<CropsStep />);
    expect(await screen.findByText(/Which crops grew here/)).toBeInTheDocument();
    for (const year of lastSeasons()) {
      const group = screen.getByRole('radiogroup', { name: new RegExp(String(year)) });
      expect(within(group).getByRole('radio', { name: 'Winter rapeseed' })).toBeInTheDocument();
    }
  });

  it('needs at least two years before the farmer can continue', async () => {
    const user = userEvent.setup();
    atStep3(demoFields.poznan);
    render(<CropsStep />);
    const [first, second] = lastSeasons();
    await user.click(
      within(await screen.findByRole('radiogroup', { name: new RegExp(String(first)) })).getByRole('radio', {
        name: 'Winter wheat',
      }),
    );
    expect(canContinue(useAppStore.getState())).toBe(false);
    expect(screen.getByText(/Pick at least two years/)).toBeInTheDocument();

    await user.click(
      within(screen.getByRole('radiogroup', { name: new RegExp(String(second)) })).getByRole('radio', {
        name: 'Winter rapeseed',
      }),
    );
    const stored = useAppStore.getState().cropHistory[demoFields.poznan.id] ?? [];
    expect(stored).toEqual([
      { year: second, crop: 'winter-rapeseed', source: 'farmer' },
      { year: first, crop: 'winter-wheat', source: 'farmer' },
    ]);
    expect(canContinue(useAppStore.getState())).toBe(true);
    expect(await screen.findByText(/Saved 2 years of crops/)).toBeInTheDocument();
  });

  it('leaves cover crops out of the main crop list', async () => {
    atStep3(demoFields.poznan);
    render(<CropsStep />);
    const group = await screen.findByRole('radiogroup', { name: new RegExp(String(lastSeasons()[0])) });
    expect(within(group).queryByRole('radio', { name: 'Phacelia' })).not.toBeInTheDocument();
  });
});

describe('CropsStep states', () => {
  it('asks for a field when none is selected', async () => {
    render(<CropsStep />);
    expect(await screen.findByText('Pick a field first.')).toBeInTheDocument();
  });

  it('shows a source error with a retry when the crop history fails, and the picker still works', async () => {
    vi.spyOn(providers.context, 'getCropHistory').mockRejectedValueOnce(new SourceError('USDA CropScape', 'timeout'));
    atStep3();
    render(<CropsStep />);
    expect(await screen.findByRole('alert')).toHaveTextContent('USDA CropScape');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(await screen.findByText(/Which crops grew here/)).toBeInTheDocument();
  });
});

describe('lastSeasons', () => {
  it('counts the current year once its harvest is in (from August)', () => {
    expect(lastSeasons(new Date(2026, 10, 14))).toEqual([2026, 2025, 2024]);
    expect(lastSeasons(new Date(2026, 2, 1))).toEqual([2025, 2024, 2023]);
  });
});
