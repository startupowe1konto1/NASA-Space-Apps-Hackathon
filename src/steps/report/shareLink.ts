// The report link: goal, field, crops and priorities packed into the URL hash (#s=...). The hash never reaches a
// server, so nothing about the farmer's field is sent anywhere when the link is opened.
import type { CropYear, Field, GoalId, PriorityId } from '../../contracts';

export interface ShareState {
  goal: GoalId;
  field: Field;
  cropHistory: CropYear[];
  priorities: { on: PriorityId[]; excludedCrops: string[] };
}

const VERSION = 1;
const GOALS: GoalId[] = ['keepSoil', 'improveSoil', 'income'];
const PRIORITIES: PriorityId[] = ['water', 'forage', 'nitrogen', 'erosion', 'organicMatter'];
const COUNTRIES = ['US', 'PL', 'OTHER'];
const SOURCES = ['farmer', 'cropscape'];

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

const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const isStr = (x: unknown): x is string => typeof x === 'string';
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

function isField(f: unknown): f is Field {
  if (!isObj(f)) return false;
  const p = f.polygon;
  const c = f.centroid;
  const ringsOk =
    isObj(p) &&
    p.type === 'Polygon' &&
    Array.isArray(p.coordinates) &&
    p.coordinates.length > 0 &&
    p.coordinates.every((ring: unknown) => Array.isArray(ring) && ring.every((pt: unknown) => Array.isArray(pt) && pt.length >= 2 && pt.every(isNum)));
  return (
    isStr(f.id) &&
    isStr(f.name) &&
    COUNTRIES.includes(f.country as string) &&
    ringsOk &&
    isObj(c) &&
    isNum(c.lat) &&
    isNum(c.lon) &&
    isNum(f.areaHa) &&
    (f.parcelIds === undefined || (Array.isArray(f.parcelIds) && f.parcelIds.every(isStr)))
  );
}

const isCropYear = (y: unknown): y is CropYear =>
  isObj(y) && isNum(y.year) && isStr(y.crop) && SOURCES.includes(y.source as string) && (y.coverCrop === undefined || isStr(y.coverCrop));

/** The state in a share code, or null when the code is broken, from another version, or incomplete. */
export function decodeShare(code: string): ShareState | null {
  if (!code) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(fromBase64(code));
  } catch {
    return null;
  }
  if (!isObj(raw) || raw.v !== VERSION) return null;
  const { goal, field, cropHistory, priorities } = raw;
  if (!GOALS.includes(goal as GoalId) || !isField(field)) return null;
  if (!Array.isArray(cropHistory) || !cropHistory.every(isCropYear)) return null;
  if (
    !isObj(priorities) ||
    !Array.isArray(priorities.on) ||
    !priorities.on.every((p) => PRIORITIES.includes(p as PriorityId)) ||
    !Array.isArray(priorities.excludedCrops) ||
    !priorities.excludedCrops.every(isStr)
  ) {
    return null;
  }
  return {
    goal: goal as GoalId,
    field,
    cropHistory,
    priorities: { on: priorities.on as PriorityId[], excludedCrops: priorities.excludedCrops as string[] },
  };
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
