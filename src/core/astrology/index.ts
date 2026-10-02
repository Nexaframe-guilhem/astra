import type { BirthData } from '../birth-data/types.js';
import { computeAstrologyRaw } from './engine.js';
import { normalizeAstrology } from './normalize.js';
import { DEFAULT_ASTROLOGY_SETTINGS, type AstrologyResult, type AstrologySettings } from './types.js';

export * from './types.js';
export { astrologyResultSchema } from './validation.js';

/** Point d'entrée public du moteur astrologique. */
export function calculateAstrology(
  birth: Pick<BirthData, 'utc' | 'latitude' | 'longitude'>,
  overrides: Partial<AstrologySettings> = {},
  now?: Date,
): AstrologyResult {
  const settings = { ...DEFAULT_ASTROLOGY_SETTINGS, ...overrides };
  const utcMs = Date.parse(birth.utc);
  const raw = computeAstrologyRaw(utcMs, birth.latitude, birth.longitude, settings);
  return normalizeAstrology(raw, settings, { utc: birth.utc, latitude: birth.latitude, longitude: birth.longitude }, now);
}
