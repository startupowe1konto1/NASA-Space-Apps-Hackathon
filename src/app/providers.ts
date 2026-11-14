// The one place that decides which implementation each provider uses.
// A lane swaps its fixture for the real module with a one-line [contract] PR to this file (docs/PLAN.md).
import type { AnalyzeField, Providers } from '../contracts';
import { fixtureAnalyzeField, fixtureProviders } from '../fixtures';

export const providers: Providers = {
  profile: fixtureProviders.profile, // O3-A2: powerProfileProvider
  context: fixtureProviders.context, // O4-A3: precomputedContextProvider
  twins: fixtureProviders.twins, // O4-B3
  money: fixtureProviders.money, // O4-A4
};

export const analyzeField: AnalyzeField = fixtureAnalyzeField; // O3-B6: the real engine

/** False until the money tables and the income score are wired (O3-B7). The goal step reads it before any analysis exists. */
export const moneyAvailable = false;
