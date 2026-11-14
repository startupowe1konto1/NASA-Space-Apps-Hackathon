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
