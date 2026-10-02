/**
 * Moteur astrologique : calcul brut à partir de l'instant UTC et des coordonnées.
 * Aucune mise en forme ici : voir normalize.ts.
 */
import {
  PLANETS, bodyEcliptic, earthOrientation, longitudeSpeed, nodeLongitude, type PlanetId,
} from '../ephemeris/index.js';
import { norm360 } from '../shared/angles.js';
import { findAspects, type AspectCalc } from './aspects.js';
import { ascendant, computeHouses, midheaven, placidusLatitudeLimit, type HouseCalc } from './houses.js';
import type { AstrologySettings } from './types.js';

export interface RawBody {
  id: PlanetId | 'northNode' | 'southNode';
  longitude: number;
  latitude: number | null;
  speed: number;
}

export interface RawAstrology {
  bodies: RawBody[];
  ascendant: number;
  midheaven: number;
  ramc: number;
  obliquity: number;
  houses: HouseCalc;
  aspects: AspectCalc[];
  warnings: string[];
}

export function computeAstrologyRaw(utcMs: number, latitude: number, longitude: number, settings: AstrologySettings): RawAstrology {
  const warnings: string[] = [];
  const bodies: RawBody[] = PLANETS.map((id) => {
    const ecl = bodyEcliptic(id, utcMs);
    return {
      id,
      longitude: ecl.longitude,
      latitude: ecl.latitude,
      speed: longitudeSpeed((t) => bodyEcliptic(id, t).longitude, utcMs, id === 'moon' ? 0.05 : 0.25),
    };
  });
  const nodeFn = (t: number) => nodeLongitude(settings.nodeType, t);
  const north = nodeFn(utcMs);
  const nodeSpeed = longitudeSpeed(nodeFn, utcMs, 0.05);
  bodies.push({ id: 'northNode', longitude: north, latitude: 0, speed: nodeSpeed });
  bodies.push({ id: 'southNode', longitude: norm360(north + 180), latitude: 0, speed: nodeSpeed });

  const { trueObliquity, gast } = earthOrientation(utcMs);
  const ramc = norm360(gast + longitude);
  const asc = ascendant(ramc, trueObliquity, latitude);
  const mc = midheaven(ramc, trueObliquity);

  let system = settings.houseSystem;
  if (system === 'placidus' && Math.abs(latitude) >= placidusLatitudeLimit(trueObliquity)) {
    warnings.push(`POLAR_LATITUDE: Placidus indéfini au-delà de ${placidusLatitudeLimit(trueObliquity).toFixed(2)}° ; repli sur ${settings.polarFallback}.`);
    system = settings.polarFallback;
  }
  const houses = computeHouses(system, ramc, trueObliquity, latitude, asc, mc);

  const pointIndex = new Map<string, { longitude: number; speed: number | null }>();
  for (const b of bodies) pointIndex.set(b.id, { longitude: b.longitude, speed: b.speed });
  pointIndex.set('ascendant', { longitude: asc, speed: null });
  pointIndex.set('midheaven', { longitude: mc, speed: null });
  const aspectPoints = settings.aspectPoints
    .filter((id) => pointIndex.has(id))
    .map((id) => ({ id, ...pointIndex.get(id)! }));
  const aspects = findAspects(aspectPoints, settings.orbs);

  return { bodies, ascendant: asc, midheaven: mc, ramc, obliquity: trueObliquity, houses, aspects, warnings };
}
