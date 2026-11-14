import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { canContinue, useAppStore } from '../app/store';
import { MapStep } from './MapStep';
import type { MapHandlers } from './leafletMap';

// Leaflet does not render in jsdom; the wrapper is replaced and its handlers are captured.
const leaflet = vi.hoisted(() => ({
  handlers: null as MapHandlers | null,
  controller: {
    setFields: vi.fn(),
    flyTo: vi.fn(),
    retryTiles: vi.fn(),
    destroy: vi.fn(),
  },
}));

vi.mock('./leafletMap', () => ({
  createLeafletMap: vi.fn((_el: HTMLElement, handlers: MapHandlers) => {
    leaflet.handlers = handlers;
    return leaflet.controller;
  }),
}));

const realAddField = useAppStore.getState().addField;

beforeEach(() => {
  useAppStore.getState().reset();
  useAppStore.setState({ step: 2, addField: vi.fn(realAddField) });
  leaflet.handlers = null;
  vi.clearAllMocks();
});

afterEach(() => {
  useAppStore.setState({ addField: realAddField });
});

describe('MapStep', () => {
  it('adds the Iowa demo field with country US and a polygon, and enables next', async () => {
    const user = userEvent.setup();
    render(<MapStep />);
    expect(canContinue(useAppStore.getState())).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Iowa demo field' }));

    const fields = screen.getByRole('list', { name: 'Your fields' });
    await within(fields).findByText('Iowa demo field, 30.0 ha');
    expect(useAppStore.getState().addField).toHaveBeenCalledWith(
      expect.objectContaining({ country: 'US', polygon: expect.objectContaining({ type: 'Polygon' }) }),
    );
    expect(canContinue(useAppStore.getState())).toBe(true);
    await waitFor(() => expect(leaflet.controller.flyTo).toHaveBeenCalledWith(expect.objectContaining({ id: 'demo-iowa' })));
  });

  it('adds the Poznań demo field with country PL', async () => {
    const user = userEvent.setup();
    render(<MapStep />);
    await user.click(screen.getByRole('button', { name: 'Poznań demo field' }));
    await screen.findByText('Poznań demo field, 8.0 ha');
    expect(useAppStore.getState().addField).toHaveBeenCalledWith(expect.objectContaining({ country: 'PL' }));
    expect(canContinue(useAppStore.getState())).toBe(true);
  });

  it('adds a 4 ha field where the map is tapped', async () => {
    render(<MapStep />);
    await waitFor(() => expect(leaflet.handlers).not.toBeNull());

    act(() => leaflet.handlers!.onClick(52.45, 17.1));

    await screen.findByText('Field at 52.4500, 17.1000, 4.0 ha');
    const state = useAppStore.getState();
    expect(state.fields[0]?.country).toBe('PL');
    expect(canContinue(state)).toBe(true);
  });

  it('shows the tile error and keeps the demo buttons working', async () => {
    const user = userEvent.setup();
    render(<MapStep />);
    await waitFor(() => expect(leaflet.handlers).not.toBeNull());

    act(() => leaflet.handlers!.onTileError());

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/map tiles did not answer/);
    await user.click(screen.getByRole('button', { name: 'Poznań demo field' }));
    await screen.findByText('Poznań demo field, 8.0 ha');

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(leaflet.controller.retryTiles).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('says so when there are no fields yet', async () => {
    render(<MapStep />);
    await screen.findByText('No fields yet.');
  });
});
