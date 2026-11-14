// Single app store. Steps read and write here; nothing else holds farmer input.
import { create } from 'zustand';
import type { Analysis, CropId, CropYear, Field, GoalId, PriorityId } from '../contracts';
import { SourceError } from '../contracts';
import { analyzeField, providers } from './providers';

export const STEP_COUNT = 7;

export type AnalysisState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: Analysis }
  | { status: 'error'; source: string; reason: string };

export interface AppState {
  step: number; // 1..STEP_COUNT
  goal: GoalId;
  fields: Field[];
  selectedFieldId: string | null;
  cropHistory: Record<string, CropYear[]>; // by field id
  priorities: { on: PriorityId[]; excludedCrops: CropId[] };
  analysis: AnalysisState;

  goToStep(step: number): void;
  setGoal(goal: GoalId): void;
  addField(field: Field): void;
  updateField(field: Field): void;
  removeField(id: string): void;
  selectField(id: string): void;
  setCropHistory(fieldId: string, history: CropYear[]): void;
  setPriorities(priorities: { on: PriorityId[]; excludedCrops: CropId[] }): void;
  runAnalysis(): Promise<void>;
  reset(): void;
}

const initial = {
  step: 1,
  goal: 'keepSoil' as GoalId,
  fields: [] as Field[],
  selectedFieldId: null as string | null,
  cropHistory: {} as Record<string, CropYear[]>,
  priorities: { on: [] as PriorityId[], excludedCrops: [] as CropId[] },
  analysis: { status: 'idle' } as AnalysisState,
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initial,

  goToStep: (step) => set({ step: Math.min(STEP_COUNT, Math.max(1, step)) }),
  // The goal only changes the ranking, and the analysis holds the ranking for every goal, so no re-run is needed.
  setGoal: (goal) => set({ goal }),

  addField: (field) =>
    set((s) => ({
      fields: [...s.fields.filter((f) => f.id !== field.id), field],
      selectedFieldId: field.id,
      analysis: { status: 'idle' },
    })),
  updateField: (field) =>
    set((s) => ({ fields: s.fields.map((f) => (f.id === field.id ? field : f)), analysis: { status: 'idle' } })),
  removeField: (id) =>
    set((s) => {
      const fields = s.fields.filter((f) => f.id !== id);
      const { [id]: _removed, ...cropHistory } = s.cropHistory;
      return {
        fields,
        cropHistory,
        selectedFieldId: s.selectedFieldId === id ? (fields[0]?.id ?? null) : s.selectedFieldId,
        analysis: { status: 'idle' },
      };
    }),
  selectField: (id) => set({ selectedFieldId: id, analysis: { status: 'idle' } }),

  setCropHistory: (fieldId, history) =>
    set((s) => ({ cropHistory: { ...s.cropHistory, [fieldId]: history }, analysis: { status: 'idle' } })),
  setPriorities: (priorities) => set({ priorities, analysis: { status: 'idle' } }),

  runAnalysis: async () => {
    const { fields, selectedFieldId, cropHistory, priorities, goal } = get();
    const field = fields.find((f) => f.id === selectedFieldId);
    if (!field) {
      set({ analysis: { status: 'error', source: 'app', reason: 'No field is selected.' } });
      return;
    }
    set({ analysis: { status: 'loading' } });
    try {
      const data = await analyzeField(
        { field, cropHistory: cropHistory[field.id] ?? [], priorities: { goal, ...priorities } },
        providers,
      );
      // Ignore the answer if the farmer changed the input while it was running.
      if (get().analysis.status === 'loading' && get().selectedFieldId === field.id) {
        set({ analysis: { status: 'ready', data } });
      }
    } catch (error) {
      const source = error instanceof SourceError ? error.source : 'analysis';
      const reason = error instanceof Error ? error.message : String(error);
      set({ analysis: { status: 'error', source, reason } });
    }
  },

  reset: () => set({ ...initial }),
}));

export const selectedField = (s: AppState): Field | undefined => s.fields.find((f) => f.id === s.selectedFieldId);

/** Whether the farmer can leave the given step. */
export function canContinue(s: AppState): boolean {
  const field = selectedField(s);
  if (s.step === 2) return field !== undefined;
  if (s.step === 3) return field !== undefined && (s.cropHistory[field.id]?.length ?? 0) >= 2;
  return s.step < STEP_COUNT;
}
