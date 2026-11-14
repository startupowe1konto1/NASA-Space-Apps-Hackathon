import { beforeEach, describe, expect, it } from 'vitest';
import { demoFields } from '../fixtures';
import { STEP_COUNT, STEP_KEYS, canContinue, useAppStore } from './store';

const field = demoFields.iowa;
const year = (y: number) => ({ year: y, crop: 'maize' as const, source: 'farmer' as const });

describe('step order (HANDOFF-frontend.md v2.1: start page, field before goal, no report)', () => {
  beforeEach(() => useAppStore.getState().reset());

  it('lists the six steps by key, field first', () => {
    expect(STEP_KEYS).toEqual(['field', 'goal', 'crops', 'priorities', 'rotations', 'money']);
    expect(STEP_COUNT).toBe(6);
  });

  it('opens on step 0, the start page', () => {
    expect(useAppStore.getState().step).toBe(0);
  });

  it('keeps goToStep between the start page and the last step', () => {
    useAppStore.getState().goToStep(-1);
    expect(useAppStore.getState().step).toBe(0);
    useAppStore.getState().goToStep(99);
    expect(useAppStore.getState().step).toBe(STEP_COUNT);
  });

  it('lets the farmer leave the field step only with a field', () => {
    const s = useAppStore.getState();
    s.goToStep(1);
    expect(canContinue(useAppStore.getState())).toBe(false);
    s.addField(field);
    expect(canContinue(useAppStore.getState())).toBe(true);
  });

  it('lets the farmer leave the goal step with nothing else filled in', () => {
    useAppStore.getState().goToStep(2);
    expect(canContinue(useAppStore.getState())).toBe(true);
  });

  it('asks for two years of crops on the crops step', () => {
    const s = useAppStore.getState();
    s.addField(field);
    s.goToStep(3);
    s.setCropHistory(field.id, [year(2025)]);
    expect(canContinue(useAppStore.getState())).toBe(false);
    s.setCropHistory(field.id, [year(2025), year(2024)]);
    expect(canContinue(useAppStore.getState())).toBe(true);
  });

  it('has no next step after the last one', () => {
    useAppStore.getState().goToStep(STEP_COUNT);
    expect(canContinue(useAppStore.getState())).toBe(false);
  });
});
