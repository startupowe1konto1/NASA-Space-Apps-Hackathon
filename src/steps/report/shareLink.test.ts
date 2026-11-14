import type { CropYear, GoalId, PriorityId } from '../../contracts';
import { demoFields } from '../../fixtures';
import { decodeShare, encodeShare, restoreFromHash, shareUrl, type ShareState } from './shareLink';

const history: CropYear[] = [
  { year: 2024, crop: 'winter-wheat', source: 'farmer' },
  { year: 2025, crop: 'maize', source: 'cropscape' },
];

const state = (): ShareState => ({
  goal: 'improveSoil' as GoalId,
  field: demoFields.poznan,
  cropHistory: history,
  priorities: { on: ['erosion', 'water'] as PriorityId[], excludedCrops: ['potato'] },
});

describe('share link', () => {
  it('decodes exactly what it encoded', () => {
    expect(decodeShare(encodeShare(state()))).toEqual(state());
  });

  it('keeps a field without parcel ids and an empty history', () => {
    const s: ShareState = { ...state(), field: demoFields.iowa, cropHistory: [] };
    expect(decodeShare(encodeShare(s))).toEqual(s);
  });

  it('returns null for text that is not a share code', () => {
    expect(decodeShare('not-a-share-code')).toBeNull();
    expect(decodeShare('')).toBeNull();
  });

  it('returns null when a required part is missing or of the wrong kind', () => {
    const broken = btoa(JSON.stringify({ v: 1, goal: 'keepSoil', field: { id: 'x' } }));
    expect(decodeShare(broken)).toBeNull();
    const badGoal = encodeShare({ ...state(), goal: 'profit' as GoalId });
    expect(decodeShare(badGoal)).toBeNull();
  });

  describe('rejects a code the contract would reject (#96 review), so bad data never reaches the store', () => {
    const withField = (patch: Record<string, unknown>) => encodeShare({ ...state(), field: { ...demoFields.poznan, ...patch } as never });
    const ring = demoFields.poznan.polygon.coordinates[0]!;

    it.each([
      ['latitude out of range', { centroid: { lat: 999, lon: 17 } }],
      ['longitude out of range', { centroid: { lat: 52, lon: -5000 } }],
      ['negative area', { areaHa: -3 }],
      ['empty id', { id: '' }],
      ['empty name', { name: '' }],
      ['an empty ring', { polygon: { type: 'Polygon', coordinates: [[]] } }],
      ['a one-point ring', { polygon: { type: 'Polygon', coordinates: [[ring[0]]] } }],
      ['a ring point out of range', { polygon: { type: 'Polygon', coordinates: [[[500, 52], ...ring.slice(1)]] } }],
      ['an unknown key on the field', { evil: 'x' }],
    ])('%s', (_label, patch) => {
      expect(decodeShare(withField(patch))).toBeNull();
    });

    it('a crop year with an unknown key, an empty crop or a fractional year', () => {
      for (const bad of [{ ...history[0], evil: 1 }, { ...history[0], crop: '' }, { ...history[0], year: 2024.5 }]) {
        expect(decodeShare(encodeShare({ ...state(), cropHistory: [bad as CropYear] }))).toBeNull();
      }
    });

    it('unknown keys at the top level or in the priorities', () => {
      // UTF-8 first, as the app does: the Poznań field name is not Latin-1
      const raw = (extra: Record<string, unknown>) =>
        btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify({ v: 1, ...state(), ...extra }))));
      expect(decodeShare(raw({}))).toEqual(state());
      expect(decodeShare(raw({ evil: 1 }))).toBeNull();
      expect(decodeShare(raw({ priorities: { ...state().priorities, evil: 1 } }))).toBeNull();
    });

    it('a valid code longer than 64 KB, before decoding it', () => {
      const long = encodeShare({ ...state(), field: { ...demoFields.poznan, name: 'x'.repeat(50 * 1024) } });
      expect(long.length).toBeGreaterThan(64 * 1024);
      expect(decodeShare(long)).toBeNull();
    });

    it('empty parcel ids', () => {
      expect(decodeShare(withField({ parcelIds: ['', ''] }))).toBeNull();
    });

    it('a __proto__ key does not pollute Object.prototype', () => {
      const valid = new TextDecoder().decode(Uint8Array.from(atob(encodeShare(state()).replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (encodeShare(state()).length % 4)) % 4)), (c) => c.charCodeAt(0)));
      const withProto = valid.replace('{"v":1,', '{"v":1,"__proto__":{"polluted":true},');
      const code = btoa(String.fromCharCode(...new TextEncoder().encode(withProto)));
      expect(decodeShare(code)).toBeNull();
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });
  });

  it('puts the code in the URL hash, so it never reaches a server', () => {
    const url = shareUrl('https://example.org/app/?x=1#old', state());
    expect(url.startsWith('https://example.org/app/?x=1#s=')).toBe(true);
    expect(decodeShare(url.split('#s=')[1]!)).toEqual(state());
  });

  it('restores the state from a hash and opens the report', () => {
    const calls: string[] = [];
    const store = {
      addField: vi.fn(() => calls.push('field')),
      setCropHistory: vi.fn(() => calls.push('crops')),
      setPriorities: vi.fn(() => calls.push('priorities')),
      setGoal: vi.fn(() => calls.push('goal')),
      goToStep: vi.fn(() => calls.push('step')),
    };
    expect(restoreFromHash(`#s=${encodeShare(state())}`, store)).toBe(true);
    expect(store.addField).toHaveBeenCalledWith(demoFields.poznan);
    expect(store.setCropHistory).toHaveBeenCalledWith(demoFields.poznan.id, history);
    expect(store.setPriorities).toHaveBeenCalledWith(state().priorities);
    expect(store.setGoal).toHaveBeenCalledWith('improveSoil');
    expect(store.goToStep).toHaveBeenCalledWith(7);
    expect(calls.at(-1)).toBe('step');
  });

  it('does nothing for a hash without a share code', () => {
    const store = { addField: vi.fn(), setCropHistory: vi.fn(), setPriorities: vi.fn(), setGoal: vi.fn(), goToStep: vi.fn() };
    expect(restoreFromHash('', store)).toBe(false);
    expect(restoreFromHash('#s=garbage', store)).toBe(false);
    expect(store.addField).not.toHaveBeenCalled();
  });
});
