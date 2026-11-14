// Merges every module's message file and turns a Message into text.
// Any folder under src may hold messages/en.json (flat: { "code": "text with {param}" }). One file per folder, so no shared text file.
import type { Message } from '../contracts';

type Dictionary = Record<string, string>;

const files = import.meta.glob<Dictionary>('../**/messages/en.json', { eager: true, import: 'default' });

export const dictionary: Dictionary = Object.assign({}, ...Object.values(files));

/** Text for a message code. An unknown code is returned as-is so a missing text is visible, not silent. */
export function t(message: Message | string, params?: Record<string, string | number>): string {
  const code = typeof message === 'string' ? message : message.code;
  const values = typeof message === 'string' ? params : { ...message.params, ...params };
  const template = dictionary[code];
  if (template === undefined) return code;
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => (values && key in values ? String(values[key]) : whole));
}
