/**
 * Angles et maisons. Formules sphériques classiques (Meeus ; Hand, "Essays on Astrology").
 * Entrées : RAMC (ascension droite du MC = TSL), obliquité vraie, latitude géographique.
 */
import { DEG, RAD, norm360 } from '../shared/angles.js';

export type HouseSystem = 'placidus' | 'whole-sign' | 'equal' | 'porphyry';

export function midheaven(ramc: number, obliquity: number): number {
  const r = ramc * DEG;
  return norm360(Math.atan2(Math.sin(r), Math.cos(r) * Math.cos(obliquity * DEG)) * RAD);
}

export function ascendant(ramc: number, obliquity: number, latitude: number): number {
  const r = ramc * DEG;
  const e = obliquity * DEG;
  const phi = latitude * DEG;
  return norm360(Math.atan2(Math.cos(r), -(Math.sin(r) * Math.cos(e) + Math.tan(phi) * Math.sin(e))) * RAD);
}

/** Longitude écliptique (β = 0) correspondant à une ascension droite donnée. */
function eclipticFromRa(ra: number, obliquity: number): number {
  const a = ra * DEG;
  return norm360(Math.atan2(Math.sin(a), Math.cos(a) * Math.cos(obliquity * DEG)) * RAD);
}

/** Limite au-delà de laquelle Placidus n'est pas défini (cercle polaire). */
export function placidusLatitudeLimit(obliquity: number): number {
  return 90 - obliquity;
}

/**
 * Cuspide Placidus intermédiaire par itération sur l'arc semi-diurne.
 * `fraction` = 1/3 ou 2/3 ; `above` = au-dessus de l'horizon (maisons 11, 12) ou non (2, 3).
 */
function placidusCusp(ramc: number, obliquity: number, latitude: number, fraction: number, above: boolean): number {
  const e = obliquity * DEG;
  const tanPhi = Math.tan(latitude * DEG);
  let lambda = above ? eclipticFromRa(ramc + fraction * 90, obliquity) : eclipticFromRa(ramc + 180 - fraction * 90, obliquity);
  for (let i = 0; i < 100; i++) {
    const decl = Math.asin(Math.sin(e) * Math.sin(lambda * DEG));
    const x = tanPhi * Math.tan(decl);
    if (Math.abs(x) > 1) throw new Error('Placidus indéfini à cette latitude');
    const ad = Math.asin(x) * RAD; // différence ascensionnelle
    const ra = above
      ? ramc + fraction * (90 + ad)
      : ramc + 180 - fraction * (90 - ad);
    const next = eclipticFromRa(ra, obliquity);
    let diff = Math.abs(next - lambda);
    if (diff > 180) diff = 360 - diff;
    lambda = next;
    if (diff < 1e-10) break;
  }
  return lambda;
}

export interface HouseCalc {
  system: HouseSystem;
  /** 12 cuspides, index 0 = maison 1. */
  cusps: number[];
}

export function computeHouses(system: HouseSystem, ramc: number, obliquity: number, latitude: number, asc: number, mc: number): HouseCalc {
  switch (system) {
    case 'whole-sign': {
      const start = Math.floor(asc / 30) * 30;
      return { system, cusps: Array.from({ length: 12 }, (_, i) => norm360(start + 30 * i)) };
    }
    case 'equal':
      return { system, cusps: Array.from({ length: 12 }, (_, i) => norm360(asc + 30 * i)) };
    case 'porphyry': {
      const q1 = norm360(asc - mc); // MC -> ASC (maisons 10, 11, 12)
      const q2 = 180 - q1; // ASC -> IC (maisons 1, 2, 3)
      const c11 = mc + q1 / 3, c12 = mc + (2 * q1) / 3;
      const c2 = asc + q2 / 3, c3 = asc + (2 * q2) / 3;
      return { system, cusps: fillOpposites(asc, c2, c3, mc, c11, c12) };
    }
    case 'placidus': {
      const c11 = placidusCusp(ramc, obliquity, latitude, 1 / 3, true);
      const c12 = placidusCusp(ramc, obliquity, latitude, 2 / 3, true);
      const c2 = placidusCusp(ramc, obliquity, latitude, 2 / 3, false);
      const c3 = placidusCusp(ramc, obliquity, latitude, 1 / 3, false);
      return { system, cusps: fillOpposites(asc, c2, c3, mc, c11, c12) };
    }
  }
}

function fillOpposites(c1: number, c2: number, c3: number, c10: number, c11: number, c12: number): number[] {
  const c4 = c10 + 180, c5 = c11 + 180, c6 = c12 + 180;
  return [c1, c2, c3, c4, c5, c6, c1 + 180, c2 + 180, c3 + 180, c10, c11, c12].map(norm360);
}

/** Maison (1-12) contenant une longitude. */
export function houseOf(longitude: number, cusps: number[]): number {
  const lon = norm360(longitude);
  for (let i = 0; i < 12; i++) {
    const start = cusps[i]!;
    const end = cusps[(i + 1) % 12]!;
    const span = norm360(end - start);
    if (norm360(lon - start) < span) return i + 1;
  }
  return 12;
}
