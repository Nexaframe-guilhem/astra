import { computeNumerologyRaw } from './engine.js';
import { normalizeNumerology } from './normalize.js';
import { NUMEROLOGY_PRESETS, type NumerologyPreset } from './presets.js';
import { DEFAULT_NUMEROLOGY_PRESET, type NumerologyInput, type NumerologyResult, type NumerologySettings } from './types.js';

export * from './types.js';
export { NUMEROLOGY_PRESETS, type NumerologyPreset } from './presets.js';
export { numerologyResultSchema } from './validation.js';

/** Point d'entrée public du moteur numérologique. */
export function calculateNumerology(
  input: NumerologyInput,
  overrides: Partial<NumerologySettings> & { preset?: NumerologyPreset } = {},
  now?: Date,
): NumerologyResult {
  const { preset = DEFAULT_NUMEROLOGY_PRESET, ...rest } = overrides;
  const base = NUMEROLOGY_PRESETS[preset as NumerologyPreset];
  if (!base) throw new Error(`Convention numérologique inconnue : ${preset}`);
  const settings: NumerologySettings = { ...base, masterNumbers: [...base.masterNumbers], karmicDebtNumbers: [...base.karmicDebtNumbers], ...rest };
  return normalizeNumerology(computeNumerologyRaw(input, settings), input, settings, now, { preset, customized: Object.keys(rest).length > 0 });
}
