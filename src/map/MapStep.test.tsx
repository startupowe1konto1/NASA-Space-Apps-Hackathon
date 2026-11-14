import { readFileSync } from 'node:fs';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { t } from '../app/i18n';
import { canContinue, useAppStore } from '../app/store';
import { demoFields } from '../fixtures';
import { MapStep } from './MapStep';
import { areaHa } from './area';
import type { MapHandlers } from './leafletMap';
import { getParcelByPoint } from './parcels/uldk';
import { parseNominatim } from './search/nominatim';

// Leaflet does not render in jsdom; the wrapper is replaced and its handlers are captured.
const leaflet = vi.hoisted(() => ({
  handlers: null as MapHandlers | null,
  controller: {
    setFields: vi.fn(),
    flyTo: vi.fn(),
    retryTiles: vi.fn(),
    destroy: vi.fn(),
    isEditing: vi.fn(() => false),
    showPlace: vi.fn(),
    startCut: vi.fn(),
    stopCut: vi.fn(),
    setParcelLayer: vi.fn(),
  },
}));

vi.mock('./leafletMap', () => ({
  createLeafletMap: vi.fn((_el: HTMLElement, handlers: MapHandlers) => {
    leaflet.handlers = handlers;
    return leaflet.controller;
  }),
}));

// No network in unit tests: ULDK finds no parcel, so a tap in Poland falls back to the 4 ha square (parcels/ has its own tests).
vi.mock('./parcels/uldk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./parcels/uldk')>()),
  getParcelByPoint: vi.fn(async () => null),
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
    await within(fields).findByText(`${demoFields.iowa.name}, ${demoFields.iowa.areaHa.toFixed(1)} ha`);
    expect(useAppStore.getState().addField).toHaveBeenCalledWith(
      expect.objectContaining({ country: 'US', polygon: expect.objectContaining({ type: 'Polygon' }) }),
    );
    expect(canContinue(useAppStore.getState())).toBe(true);
    await waitFor(() => expect(leaflet.controller.flyTo).toHaveBeenCalledWith(expect.objectContaining({ id: demoFields.iowa.id })));
  });

  it('flies to the demo field again when its button is tapped a second time', async () => {
    const user = userEvent.setup();
    render(<MapStep />);
    await user.click(screen.getByRole('button', { name: 'Iowa demo field' }));
    await waitFor(() => expect(leaflet.controller.flyTo).toHaveBeenCalled());
    const before = leaflet.controller.flyTo.mock.calls.length;
    await user.click(screen.getByRole('button', { name: 'Iowa demo field' }));
    expect(leaflet.controller.flyTo.mock.calls.length).toBeGreaterThan(before);
  });

  it('adds the Poznań demo field with country PL', async () => {
    const user = userEvent.setup();
    render(<MapStep />);
    await user.click(screen.getByRole('button', { name: 'Poznań demo field' }));
    await screen.findByText(`${demoFields.poznan.name}, ${demoFields.poznan.areaHa.toFixed(1)} ha`);
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
    await screen.findByText(`${demoFields.poznan.name}, ${demoFields.poznan.areaHa.toFixed(1)} ha`);

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(leaflet.controller.retryTiles).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('says so when there are no fields yet', async () => {
    render(<MapStep />);
    await screen.findByText('No fields yet.');
  });

  it('does not add a point field when the map is tapped while a draw, edit or delete mode is on', async () => {
    render(<MapStep />);
    await waitFor(() => expect(leaflet.handlers).not.toBeNull());
    leaflet.controller.isEditing.mockReturnValue(true);

    act(() => leaflet.handlers!.onClick(52.45, 17.1));

    await screen.findByText('No fields yet.');
    expect(useAppStore.getState().fields).toHaveLength(0);
    expect(getParcelByPoint).not.toHaveBeenCalled(); // no ULDK request either
    leaflet.controller.isEditing.mockReturnValue(false);
  });

  it('adds a drawn outline as a new selected field with its area', async () => {
    render(<MapStep />);
    await waitFor(() => expect(leaflet.handlers).not.toBeNull());
    const outline = demoFields.poznan.polygon;

    act(() => leaflet.handlers!.onDrawn(outline));

    const state = useAppStore.getState();
    expect(state.fields).toHaveLength(1);
    const drawn = state.fields[0]!;
    expect(drawn.id).not.toBe(demoFields.poznan.id);
    expect(drawn.country).toBe('PL');
    expect(state.selectedFieldId).toBe(drawn.id);
    await screen.findByText(`${drawn.name}, ${drawn.areaHa.toFixed(1)} ha`);
    expect(drawn.areaHa).toBeCloseTo(areaHa(outline), 9);
  });

  it('updates a field when its outline is edited on the map', async () => {
    useAppStore.setState({ fields: [demoFields.poznan], selectedFieldId: demoFields.poznan.id });
    render(<MapStep />);
    await waitFor(() => expect(leaflet.handlers).not.toBeNull());
    // The Iowa rectangle is a different size, so the edited field must take its area.
    const newOutline = demoFields.iowa.polygon;

    act(() => leaflet.handlers!.onEdited(demoFields.poznan.id, newOutline));

    const edited = useAppStore.getState().fields[0]!;
    expect(edited.id).toBe(demoFields.poznan.id);
    expect(edited.name).toBe(demoFields.poznan.name);
    expect(edited.areaHa).toBeCloseTo(areaHa(newOutline), 9);
    await screen.findByText(`${demoFields.poznan.name}, ${areaHa(newOutline).toFixed(1)} ha`);
  });

  it('removes a field deleted on the map', async () => {
    useAppStore.setState({ fields: [demoFields.poznan], selectedFieldId: demoFields.poznan.id });
    render(<MapStep />);
    await waitFor(() => expect(leaflet.handlers).not.toBeNull());

    act(() => leaflet.handlers!.onRemoved(demoFields.poznan.id));

    await screen.findByText('No fields yet.');
    expect(useAppStore.getState().fields).toHaveLength(0);
  });

  it('moves the map to a typed address without adding a field', async () => {
    const body = readFileSync('data/samples/geocoders/nominatim-ames-iowa.json', 'utf8');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status: 200 })));
    const user = userEvent.setup();
    render(<MapStep />);

    await user.type(screen.getByLabelText(t('search.label')), 'Ames');
    await user.click(screen.getByRole('button', { name: t('search.button') }));

    const [place] = parseNominatim(body);
    await screen.findByText(t('search.moved', { label: place!.label }));
    expect(leaflet.controller.showPlace).toHaveBeenCalledWith(place!.lat, place!.lon, place!.label);
    expect(useAppStore.getState().fields).toHaveLength(0);
    vi.unstubAllGlobals();
  });

  it('selects a field from the list with a radio, not a button', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ fields: [demoFields.iowa, demoFields.poznan], selectedFieldId: demoFields.iowa.id });
    render(<MapStep />);
    const poznanRow = `${demoFields.poznan.name}, ${demoFields.poznan.areaHa.toFixed(1)} ha`;

    await user.click(await screen.findByRole('radio', { name: poznanRow }));

    await waitFor(() => expect(useAppStore.getState().selectedFieldId).toBe(demoFields.poznan.id));
    // e2e finds the demo button by substring, so it must stay the only button carrying a field name.
    expect(screen.getAllByRole('button', { name: /Iowa demo field/ })).toHaveLength(1);
  });
});

describe('cutting a field and the parcel layer', () => {
  const lineThrough = (f: { centroid: { lat: number; lon: number } }): [[number, number], [number, number]] => [
    [f.centroid.lon - 1, f.centroid.lat],
    [f.centroid.lon + 1, f.centroid.lat],
  ];
  const cutButton = () => screen.getByRole('button', { name: t('edit.cut.start') });

  it('keeps the cut button off until a field is selected', async () => {
    const user = userEvent.setup();
    render(<MapStep />);
    expect(cutButton()).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Iowa demo field' }));
    expect(cutButton()).toBeEnabled();
  });

  it('starts cut mode, explains it, and offers to cancel until the map reports the mode is off', async () => {
    const user = userEvent.setup();
    render(<MapStep />);
    await user.click(screen.getByRole('button', { name: 'Iowa demo field' }));

    await user.click(cutButton());
    expect(leaflet.controller.startCut).toHaveBeenCalledTimes(1);
    act(() => leaflet.handlers!.onCutMode(true));
    expect(await screen.findByText(t('edit.cut.hint'))).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: t('edit.cut.cancel') }));
    expect(leaflet.controller.stopCut).toHaveBeenCalledTimes(1);
    act(() => leaflet.handlers!.onCutMode(false));
    await waitFor(() => expect(screen.queryByText(t('edit.cut.hint'))).not.toBeInTheDocument());
    expect(cutButton()).toBeInTheDocument();
  });

  it('replaces the selected field with its two parts when the cut line arrives, and says so', async () => {
    const user = userEvent.setup();
    render(<MapStep />);
    await user.click(screen.getByRole('button', { name: 'Iowa demo field' }));
    const { iowa } = demoFields;

    act(() => leaflet.handlers!.onCut(lineThrough(iowa)));

    const first = t('split.field.name', { name: iowa.name, n: 1 });
    const second = t('split.field.name', { name: iowa.name, n: 2 });
    expect(await screen.findByText(t('edit.cut.done', { name: iowa.name, a: first, b: second }))).toBeInTheDocument();
    const names = useAppStore.getState().fields.map((f) => f.name);
    expect(names).toEqual(expect.arrayContaining([first, second]));
    expect(names).not.toContain(iowa.name);
    expect(canContinue(useAppStore.getState())).toBe(true);
  });

  it('says why a cut failed and keeps the field', async () => {
    const user = userEvent.setup();
    render(<MapStep />);
    await user.click(screen.getByRole('button', { name: 'Iowa demo field' }));
    const { iowa } = demoFields;

    act(() =>
      leaflet.handlers!.onCut([
        [iowa.centroid.lon + 5, iowa.centroid.lat],
        [iowa.centroid.lon + 5, iowa.centroid.lat + 1],
      ]),
    );

    expect(await screen.findByText(t('edit.cut.fail.no-crossing'))).toBeInTheDocument();
    expect(useAppStore.getState().fields.map((f) => f.id)).toEqual([iowa.id]);
  });

  it('shows the parcel layer when its box is ticked and hides it when it is cleared', async () => {
    const user = userEvent.setup();
    render(<MapStep />);
    const box = screen.getByRole('checkbox', { name: t('edit.layer.label') });
    expect(box).not.toBeChecked();

    await user.click(box);
    expect(leaflet.controller.setParcelLayer).toHaveBeenLastCalledWith(true);
    await user.click(box);
    expect(leaflet.controller.setParcelLayer).toHaveBeenLastCalledWith(false);
  });

  it('shows a source error when the parcel layer does not load, and retries it', async () => {
    const user = userEvent.setup();
    render(<MapStep />);
    await user.click(screen.getByRole('checkbox', { name: t('edit.layer.label') }));

    act(() => leaflet.handlers!.onParcelLayerError());
    expect(await screen.findByText(t('edit.layer.error'))).toBeInTheDocument();

    leaflet.controller.setParcelLayer.mockClear();
    await user.click(screen.getByRole('button', { name: t('ui.state.retry') }));
    expect(leaflet.controller.setParcelLayer.mock.calls).toEqual([[false], [true]]);
    await waitFor(() => expect(screen.queryByText(t('edit.layer.error'))).not.toBeInTheDocument());
  });
});

