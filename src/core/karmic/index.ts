/**
 * Astrologie karmique : lecture des points traditionnellement associés au « passé » et à
 * l'évolution (nœuds lunaires, Saturne, Chiron, Lilith, planètes rétrogrades, maison 12).
 * S'appuie sur le thème tropical déjà calculé (maisons, nœuds, Saturne) et ajoute Chiron et Lilith.
 */
import type { AstrologyResult } from '../astrology/types.js';
import { houseOf } from '../astrology/houses.js';
import type { BirthData } from '../birth-data/types.js';
import { chironLongitude, longitudeSpeed, meanLilithLongitude } from '../ephemeris/index.js';
import { round } from '../shared/angles.js';
import { buildMeta, RUNTIME_VERSIONS } from '../shared/meta.js';
import { zodiacPosition } from '../shared/zodiac.js';
import type { KarmicResult } from './validation.js';

export { karmicResultSchema, type KarmicResult } from './validation.js';

export const KARMIC_ENGINE = 'astra-karmic';
export const KARMIC_ENGINE_VERSION = '0.1.0';
export const RETROGRADE_PLANETS = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'] as const;
export const HOUSE12_BODIES = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron', 'lilith'] as const;

export function calculateKarmic(birth: Pick<BirthData, 'utc'>, astrology: AstrologyResult, now?: Date): KarmicResult {
  const utcMs = Date.parse(birth.utc);
  const cusps = astrology.houses.map((h) => h.longitude);
  const place = (key: string, longitude: number, retrograde: boolean) => {
    const z = zodiacPosition(longitude);
    const house = houseOf(longitude, cusps);
    return {
      longitude: round(longitude, 6), ...z, house, retrograde,
      contentKeys: { sign: `karmic.${key}.${z.sign}`, house: `karmic.${key}House.${house}` },
    };
  };
  const fromChart = (key: string, id: string) => {
    const b = astrology.bodies[id]!;
    return place(key, b.longitude, b.retrograde);
  };

  const warnings: string[] = [];
  const chironLon = chironLongitude(utcMs);
  if (chironLon === null) warnings.push('CHIRON_OUT_OF_RANGE: Chiron n’est calculé que pour les naissances entre 1900 et 2100.');
  const chironSpeed = chironLon === null ? 0 : longitudeSpeed((t) => chironLongitude(t) ?? chironLon, utcMs, 1);
  const lilithLon = meanLilithLongitude(utcMs);

  const north = fromChart('nodes', 'northNode');
  const southBody = astrology.bodies.southNode!;
  const { contentKeys: _drop, ...south } = place('nodes', southBody.longitude, southBody.retrograde);
  const chiron = chironLon === null ? null : place('chiron', chironLon, chironSpeed < 0);
  const lilith = place('lilith', lilithLon, false);

  const houseOfBody = (id: string) => (id === 'chiron' ? chiron?.house : id === 'lilith' ? lilith.house : astrology.bodies[id]?.house);

  return {
    meta: buildMeta({
      engine: KARMIC_ENGINE,
      engineVersion: KARMIC_ENGINE_VERSION,
      dependencies: { 'astronomy-engine': RUNTIME_VERSIONS['astronomy-engine'], chiron: 'table intégrée 1900-2100 (scripts/build-chiron-table.ts)' },
      settings: { lilith: 'mean', nodeType: String(astrology.meta.settings.nodeType), houseSystem: astrology.houseSystem },
      hashedInput: { utc: birth.utc, astrology: astrology.meta.inputHash },
      now,
    }),
    contentKey: 'karmic.intro',
    nodes: { north, south },
    saturn: fromChart('saturn', 'saturn'),
    chiron,
    lilith,
    retrogrades: RETROGRADE_PLANETS.filter((p) => astrology.bodies[p]?.retrograde).map((id) => ({ id, contentKey: `karmic.retrograde.${id}` })),
    house12: HOUSE12_BODIES.filter((id) => houseOfBody(id) === 12).map((id) => ({ id, contentKey: `karmic.house12.${id}` })),
    warnings,
  };
}
