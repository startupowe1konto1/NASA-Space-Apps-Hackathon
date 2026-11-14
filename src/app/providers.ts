// The one place that decides which implementation each provider uses.
// A lane swaps its fixture for the real module with a one-line [contract] PR to this file (docs/PLAN.md).
import type { AnalyzeField, Providers } from '../contracts';
import { precomputedContextProvider } from '../context-data/provider';
import { fixtureAnalyzeField, fixtureProviders } from '../fixtures';
import { powerProfileProvider } from '../profile/provider';

export const providers: Providers = {
  profile: powerProfileProvider, // O3-A2: NASA POWER monthly, live
  context: precomputedContextProvider, // O4-A3
  twins: fixtureProviders.twins, // O4-B3
  money: fixtureProviders.money, // O4-A4
};

export const analyzeField: AnalyzeField = fixtureAnalyzeField; // O3-B6: the real engine

/** False until the money tables and the income score are wired (O3-B7). The goal step reads it before any analysis exists. */
export const moneyAvailable = false;
