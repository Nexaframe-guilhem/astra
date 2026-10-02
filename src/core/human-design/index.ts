import type { BirthData } from '../birth-data/types.js';
import { computeHumanDesignRaw } from './engine.js';
import { normalizeHumanDesign } from './normalize.js';
import { DEFAULT_HUMAN_DESIGN_SETTINGS, type HumanDesignResult, type HumanDesignSettings } from './types.js';

export * from './types.js';
export { humanDesignResultSchema } from './validation.js';

/** Point d'entrée public du moteur Human Design. */
export function calculateHumanDesign(
  birth: Pick<BirthData, 'utc'>,
  overrides: Partial<HumanDesignSettings> = {},
  now?: Date,
): HumanDesignResult {
  const settings = { ...DEFAULT_HUMAN_DESIGN_SETTINGS, ...overrides };
  const raw = computeHumanDesignRaw(Date.parse(birth.utc), settings.nodeType);
  return normalizeHumanDesign(raw, settings, { utc: birth.utc }, now);
}
