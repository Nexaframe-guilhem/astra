import { RUNTIME_VERSIONS, buildMeta } from '../shared/meta.js';
import { norm360, round } from '../shared/angles.js';
import { elementOf, modalityOf, zodiacPosition, type SignId } from '../shared/zodiac.js';
import { DELTA_T_MODEL } from '../ephemeris/index.js';
import type { RawAstrology } from './engine.js';
import { houseOf } from './houses.js';
import type { AnglePoint, AstrologyResult, AstrologySettings, BodyPosition } from './types.js';

export const ASTROLOGY_ENGINE = 'astra-astrology';
export const ASTROLOGY_ENGINE_VERSION = '0.1.0';

function point(longitude: number) {
  const lon = norm360(longitude);
  return { longitude: round(lon, 6), ...zodiacPosition(lon) };
}

function anglePoint(id: string, longitude: number): AnglePoint {
  const p = point(longitude);
  return {
    id,
    ...p,
    contentKeys: { point: `astrology.angles.${id}`, sign: `astrology.signs.${p.sign}`, placement: `astrology.angleInSign.${id}.${p.sign}` },
  };
}

const DISTRIBUTION_BODIES = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

export function normalizeAstrology(
  raw: RawAstrology,
  settings: AstrologySettings,
  hashedInput: unknown,
  now?: Date,
): AstrologyResult {
  const cusps = raw.houses.cusps;
  const bodies: Record<string, BodyPosition> = {};
  for (const b of raw.bodies) {
    const p = point(b.longitude);
    const house = houseOf(b.longitude, cusps);
    bodies[b.id] = {
      id: b.id,
      ...p,
      latitude: b.latitude === null ? null : round(b.latitude, 6),
      speed: round(b.speed, 6),
      retrograde: b.speed < 0,
      house,
      contentKeys: {
        body: `astrology.bodies.${b.id}`,
        sign: `astrology.signs.${p.sign}`,
        placement: `astrology.bodyInSign.${b.id}.${p.sign}`,
        house: `astrology.bodyInHouse.${b.id}.${house}`,
      },
    };
  }

  const elements: Record<string, string[]> = { fire: [], earth: [], air: [], water: [] };
  const modalities: Record<string, string[]> = { cardinal: [], fixed: [], mutable: [] };
  for (const id of DISTRIBUTION_BODIES) {
    const sign = bodies[id]!.sign as SignId;
    elements[elementOf(sign)]!.push(id);
    modalities[modalityOf(sign)]!.push(id);
  }

  return {
    meta: buildMeta({
      engine: ASTROLOGY_ENGINE,
      engineVersion: ASTROLOGY_ENGINE_VERSION,
      dependencies: { 'astronomy-engine': RUNTIME_VERSIONS['astronomy-engine'], deltaT: DELTA_T_MODEL },
      settings: { ...settings, effectiveHouseSystem: raw.houses.system },
      hashedInput,
      now,
    }),
    zodiac: 'tropical',
    houseSystem: raw.houses.system,
    bodies,
    angles: {
      ascendant: anglePoint('ascendant', raw.ascendant),
      midheaven: anglePoint('midheaven', raw.midheaven),
      descendant: anglePoint('descendant', raw.ascendant + 180),
      imumCoeli: anglePoint('imumCoeli', raw.midheaven + 180),
    },
    houses: cusps.map((c, i) => {
      const p = point(c);
      return { house: i + 1, ...p, contentKeys: { house: `astrology.houses.${i + 1}`, sign: `astrology.houseInSign.${i + 1}.${p.sign}` } };
    }),
    aspects: raw.aspects.map((a) => ({
      ...a,
      angle: round(a.angle, 4),
      orb: round(a.orb, 4),
      contentKeys: { aspect: `astrology.aspects.${a.type}`, pair: `astrology.aspectPairs.${a.a}.${a.type}.${a.b}` },
    })),
    distribution: { elements, modalities },
    warnings: raw.warnings,
  };
}
