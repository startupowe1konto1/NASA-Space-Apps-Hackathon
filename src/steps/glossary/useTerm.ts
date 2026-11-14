// Glossary text for <Term>: `<Term {...useTerm('ndvi')} />`. Nothing here is stateful, so useTerm is a plain lookup
// with a hook-style name; `term` is the same function for use outside components.
import terms from './terms.en.json';

export type TermId = keyof typeof terms;
export interface TermText {
  label: string;
  explanation: string;
}

const table: Record<string, TermText> = terms;

export const TERM_IDS = Object.keys(terms) as TermId[];

/** Text for a term. With `strict`, an unknown id throws; without it, the id is shown so the gap is visible on screen. */
export function lookupTerm(id: string, strict: boolean): TermText {
  const entry = table[id];
  if (entry) return entry;
  if (strict) throw new Error(`Unknown glossary term "${id}". Add it to src/steps/glossary/terms.en.json.`);
  return { label: id, explanation: id };
}

/** Tests fail on an unknown id; the running app shows the id instead of crashing. */
export function term(id: TermId): TermText {
  return lookupTerm(id, import.meta.env.MODE === 'test');
}

export const useTerm = term;
