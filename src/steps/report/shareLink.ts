// The report link: goal, field, crops and priorities packed into the URL hash (#s=...). The hash never reaches a
// server, so nothing about the farmer's field is sent anywhere when the link is opened.
import { z } from 'zod';
import type { CropYear, Field, GoalId, PriorityId } from '../../contracts';
import { field, goalId } from '../../contracts/schemas';

export interface ShareState {
  goal: GoalId;
  field: Field;
  cropHistory: CropYear[];
  priorities: { on: PriorityId[]; excludedCrops: string[] };
}

const VERSION = 1;
/** Codes longer than this are refused before decoding: a real share code is a few kilobytes. */
const MAX_CODE_LENGTH = 64 * 1024;

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64(code: string): string {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

export function encodeShare(state: ShareState): string {
  return toBase64Url(JSON.stringify({ v: VERSION, ...state }));
}

// A share code comes from outside the app, so it is checked against the contract schemas (src/contracts/schemas.ts)
// and rejected whole on any mismatch: strict objects drop nothing silently, and a ring point must be a real lon/lat.
const lonLat = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);
const shareField = z.strictObject({
  ...field.shape,
  polygon: z.strictObject({ type: z.literal('Polygon'), coordinates: z.array(z.array(lonLat).min(4)).min(1) }),
  centroid: z.strictObject(field.shape.centroid.shape),
});
const shareCropYear = z.strictObject({
  year: z.number().int(),
  crop: z.string().min(1),
  coverCrop: z.string().min(1).optional(),
  source: z.enum(['farmer', 'cropscape']),
});
const shareState = z.strictObject({
  v: z.literal(VERSION),
  goal: goalId,
  field: shareField,
  cropHistory: z.array(shareCropYear),
  priorities: z.strictObject({
    on: z.array(z.enum(['water', 'forage', 'nitrogen', 'erosion', 'organicMatter'])),
    excludedCrops: z.array(z.string().min(1)),
  }),
});

/** The state in a share code, or null when the code is broken, from another version, too long or not what the contract allows. */
export function decodeShare(code: string): ShareState | null {
  if (!code || code.length > MAX_CODE_LENGTH) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(fromBase64(code));
  } catch {
    return null;
  }
  const parsed = shareState.safeParse(raw);
  if (!parsed.success) return null;
  const { goal, field: f, cropHistory, priorities } = parsed.data;
  return { goal, field: f as Field, cropHistory: cropHistory as CropYear[], priorities: priorities as ShareState['priorities'] };
}

/** The current page address with the share code as its hash (any older hash is replaced). */
export function shareUrl(currentHref: string, state: ShareState): string {
  return `${currentHref.split('#')[0]}#s=${encodeShare(state)}`;
}

interface RestoreTarget {
  addField(field: Field): void;
  setCropHistory(fieldId: string, history: CropYear[]): void;
  setPriorities(priorities: ShareState['priorities']): void;
  setGoal(goal: GoalId): void;
  goToStep(step: number): void;
}

/** Puts a shared state into the store and opens the report. Returns false when the hash holds no valid code. */
export function restoreFromHash(hash: string, store: RestoreTarget): boolean {
  const match = /(?:^#|&)s=([^&]+)/.exec(hash);
  const state = match ? decodeShare(match[1]!) : null;
  if (!state) return false;
  store.addField(state.field);
  store.setCropHistory(state.field.id, state.cropHistory);
  store.setPriorities(state.priorities);
  store.setGoal(state.goal);
  store.goToStep(7);
  return true;
}
