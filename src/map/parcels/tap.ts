// A tap on the map in Poland asks ULDK for the parcel there. With no parcel, or when ULDK fails, the tap
// still adds the 4 ha square, and the note says why.
import { create } from 'zustand';
import { useAppStore } from '../../app/store';
import type { Field } from '../../contracts';
import { guessCountry, pointToField } from '../pointToField';
import { getParcelByPoint } from './uldk';

export type TapState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'parcel'; teryt: string }
  | { status: 'fallback'; reason: 'none' | 'error' };

export const useParcelTap = create<{ tap: TapState }>(() => ({ tap: { status: 'idle' } }));

let latestTap = 0;

/** Adds the field for a tap at this point. Only the answer to the latest tap is used. */
export async function addFieldAt(lat: number, lon: number, fetchImpl: typeof fetch = fetch): Promise<void> {
  const ticket = ++latestTap;
  const add = (field: Field, tap: TapState) => {
    useAppStore.getState().addField(field);
    useParcelTap.setState({ tap });
  };

  if (guessCountry(lat, lon) !== 'PL') {
    add(pointToField(lat, lon), { status: 'idle' });
    return;
  }

  useParcelTap.setState({ tap: { status: 'loading' } });
  let parcel: Field | null = null;
  let failed = false;
  try {
    parcel = await getParcelByPoint(lat, lon, fetchImpl);
  } catch {
    failed = true;
  }
  if (ticket !== latestTap) return;

  if (parcel) add(parcel, { status: 'parcel', teryt: parcel.parcelIds?.[0] ?? parcel.name });
  else add(pointToField(lat, lon), { status: 'fallback', reason: failed ? 'error' : 'none' });
}
