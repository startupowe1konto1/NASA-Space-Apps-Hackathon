import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { providers } from '../../app/providers';
import { useAppStore } from '../../app/store';
import { demoFields, fixtureCrops } from '../../fixtures';
import { PrioritiesStep } from './PrioritiesStep';

beforeEach(() => {
  useAppStore.getState().reset();
  // The step is tested against the fixture crop lists, not the sourced tables in data/crops/, which change as O4 adds sources.
  vi.spyOn(providers.context, 'getCrops').mockImplementation(async (country) =>
    country === 'OTHER' ? [] : fixtureCrops[country],
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

const SWITCHES = ['Use less water', 'Grow forage', 'Fix and keep nitrogen', 'Stop erosion', 'Build organic matter'];

describe('PrioritiesStep', () => {
  it('shows five switches, each with a one-line explanation', async () => {
    useAppStore.getState().addField(demoFields.iowa);
    render(<PrioritiesStep />);
    for (const name of SWITCHES) {
      const box = await screen.findByRole('checkbox', { name });
      expect(box).not.toBeChecked();
      expect(box).toHaveAccessibleDescription(/\w{3,}/);
    }
  });

  it('stores a switched-on priority and removes it when switched off', async () => {
    const user = userEvent.setup();
    useAppStore.getState().addField(demoFields.iowa);
    render(<PrioritiesStep />);
    await user.click(await screen.findByRole('checkbox', { name: 'Stop erosion' }));
    await user.click(screen.getByRole('checkbox', { name: 'Use less water' }));
    expect(useAppStore.getState().priorities.on).toEqual(['erosion', 'water']);
    await user.click(screen.getByRole('checkbox', { name: 'Stop erosion' }));
    expect(useAppStore.getState().priorities.on).toEqual(['water']);
  });

  it('lists the crops of the field country and stores an excluded crop', async () => {
    const user = userEvent.setup();
    useAppStore.getState().addField(demoFields.iowa);
    render(<PrioritiesStep />);
    const list = await screen.findByRole('group', { name: /crops you will not grow/i });
    const maize = await within(list).findByRole('checkbox', { name: 'Maize' });
    await user.click(maize);
    expect(useAppStore.getState().priorities.excludedCrops).toEqual(['maize']);
    expect(within(list).getByRole('checkbox', { name: 'Soybean' })).not.toBeChecked();
  });

  it('shows Polish crops for the Poznań field', async () => {
    useAppStore.getState().addField(demoFields.poznan);
    render(<PrioritiesStep />);
    const list = await screen.findByRole('group', { name: /crops you will not grow/i });
    expect(await within(list).findByRole('checkbox', { name: 'Winter rapeseed' })).toBeInTheDocument();
  });

  it('explains that crop lists exist for the USA and Poland only when the field is elsewhere', async () => {
    useAppStore.getState().addField({ ...demoFields.iowa, id: 'elsewhere', country: 'OTHER' });
    render(<PrioritiesStep />);
    expect(await screen.findByText(/Crop lists exist for the USA and Poland only/)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Stop erosion' })).toBeInTheDocument();
  });

  it('asks for a field first when none is selected, and the switches still work', async () => {
    render(<PrioritiesStep />);
    expect(await screen.findByText(/Pick a field first to see its crops/)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Grow forage' })).toBeInTheDocument();
  });
});
