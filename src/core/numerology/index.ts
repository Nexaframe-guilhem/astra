import { computeNumerologyRaw } from './engine.js';
import { normalizeNumerology } from './normalize.js';
import { DEFAULT_NUMEROLOGY_SETTINGS, type NumerologyInput, type NumerologyResult, type NumerologySettings } from './types.js';

export * from './types.js';
export { numerologyResultSchema } from './validation.js';

/** Point d'entrée public du moteur numérologique. */
export function calculateNumerology(
  input: NumerologyInput,
  overrides: Partial<NumerologySettings> = {},
  now?: Date,
): NumerologyResult {
  const settings = { ...DEFAULT_NUMEROLOGY_SETTINGS, ...overrides };
  return normalizeNumerology(computeNumerologyRaw(input, settings), input, settings, now);
}
