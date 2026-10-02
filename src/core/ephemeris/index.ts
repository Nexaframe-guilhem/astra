/**
 * Couche astronomique : SEUL fichier de l'application qui importe astronomy-engine.
 * Positions géocentriques apparentes, écliptique vraie de la date (zodiaque tropical).
 * Remplacer la bibliothèque (ex. par une éphéméride JPL) ne touche que ce fichier.
 */
import * as Astronomy from 'astronomy-engine';
import { norm360, RAD } from '../shared/angles.js';
import CHIRON_TABLE from './chiron-table.json' with { type: 'json' };

export const EPHEMERIS_ID = 'astronomy-engine';
export const EPHEMERIS_VERSION = '2.1.19';
export const DELTA_T_MODEL = 'Espenak-Meeus 2006 (astronomy-engine default)';

export const PLANETS = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
] as const;
export type PlanetId = (typeof PLANETS)[number];

const BODY: Record<PlanetId, Astronomy.Body> = {
  sun: Astronomy.Body.Sun,
  moon: Astronomy.Body.Moon,
  mercury: Astronomy.Body.Mercury,
  venus: Astronomy.Body.Venus,
  mars: Astronomy.Body.Mars,
  jupiter: Astronomy.Body.Jupiter,
  saturn: Astronomy.Body.Saturn,
  uranus: Astronomy.Body.Uranus,
  neptune: Astronomy.Body.Neptune,
  pluto: Astronomy.Body.Pluto,
};

export type NodeType = 'true' | 'mean';

const DAY_MS = 86400000;
const CHIRON_START = Date.parse(CHIRON_TABLE.startUtc);

/** Longitude/latitude écliptiques géocentriques apparentes (degrés). */
export function bodyEcliptic(body: PlanetId, utcMs: number): { longitude: number; latitude: number } {
  const ecl = Astronomy.Ecliptic(Astronomy.GeoVector(BODY[body], new Date(utcMs), true));
  return { longitude: norm360(ecl.elon), latitude: ecl.elat };
}

export function bodyLongitude(body: PlanetId, utcMs: number): number {
  return bodyEcliptic(body, utcMs).longitude;
}

/** Vitesse en longitude (°/jour) par différence centrée. Négative => rétrograde. */
export function longitudeSpeed(fn: (utcMs: number) => number, utcMs: number, stepDays = 0.25): number {
  const h = stepDays * DAY_MS;
  let d = fn(utcMs + h) - fn(utcMs - h);
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d / (2 * stepDays);
}

/** Nœud nord lunaire moyen (Meeus, Astronomical Algorithms, 47.7). */
export function meanNodeLongitude(utcMs: number): number {
  const time = Astronomy.MakeTime(new Date(utcMs));
  const T = time.tt / 36525;
  return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441 - (T * T * T * T) / 60616000);
}

/**
 * Nœud nord lunaire vrai (osculateur) : intersection du plan instantané de l'orbite lunaire
 * (r × v) avec l'écliptique vraie de la date.
 */
export function trueNodeLongitude(utcMs: number): number {
  const date = new Date(utcMs);
  const state = Astronomy.RotateState(Astronomy.Rotation_EQJ_ECT(date), Astronomy.GeoMoonState(date));
  const hx = state.y * state.vz - state.z * state.vy;
  const hy = state.z * state.vx - state.x * state.vz;
  return norm360(Math.atan2(hx, -hy) * RAD);
}

export function nodeLongitude(type: NodeType, utcMs: number): number {
  return type === 'true' ? trueNodeLongitude(utcMs) : meanNodeLongitude(utcMs);
}

/** Nutation en longitude Δψ (degrés, IAU 2000B) et siècles juliens TT depuis J2000. */
export function nutationAndCenturies(utcMs: number): { dpsi: number; T: number } {
  const time = Astronomy.MakeTime(new Date(utcMs));
  return { dpsi: Astronomy.e_tilt(time).dpsi / 3600, T: time.tt / 36525 };
}

/** Obliquité vraie de l'écliptique (degrés) et temps sidéral apparent de Greenwich (degrés). */
export function earthOrientation(utcMs: number): { trueObliquity: number; gast: number } {
  const time = Astronomy.MakeTime(new Date(utcMs));
  return {
    trueObliquity: Astronomy.e_tilt(time).tobl,
    gast: norm360(Astronomy.SiderealTime(time) * 15),
  };
}

/**
 * Recherche l'instant (avant `beforeUtcMs`) où le Soleil apparent atteint `targetLongitude`.
 * Bissection déterministe sur une fenêtre fournie, précision ~1 ms.
 */
export function findSunLongitudeBefore(targetLongitude: number, beforeUtcMs: number, windowDays: [number, number]): number {
  const f = (t: number) => {
    let d = bodyLongitude('sun', t) - targetLongitude;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d;
  };
  let lo = beforeUtcMs - windowDays[1] * DAY_MS;
  let hi = beforeUtcMs - windowDays[0] * DAY_MS;
  let flo = f(lo);
  if (flo > 0 || f(hi) < 0) throw new Error('Fenêtre de recherche solaire invalide');
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    const fm = f(mid);
    if (fm < 0) {
      lo = mid;
      flo = fm;
    } else {
      hi = mid;
    }
  }
  return hi;
}

/** Lilith (Lune noire moyenne) : apogée moyen de l'orbite lunaire (Meeus, Astronomical Algorithms, 50.1, + 180°). */
export function meanLilithLongitude(utcMs: number): number {
  const T = Astronomy.MakeTime(new Date(utcMs)).tt / 36525;
  return norm360(83.3532465 + 4069.0137287 * T - 0.01032 * T * T - (T * T * T) / 80053 + (T * T * T * T) / 18999000 + 180);
}

/** Domaine couvert par la table de Chiron (UTC, millisecondes). */
export const CHIRON_RANGE = { from: Date.UTC(1900, 0, 1), to: Date.UTC(2100, 0, 1) };
const OBLIQUITY_J2000 = 23.4392911 / RAD;
const LIGHT_DAYS_PER_AU = 0.0057755183;

function chironHelio(utcMs: number): [number, number, number] {
  const f = (utcMs - CHIRON_START) / (CHIRON_TABLE.stepDays * DAY_MS);
  const i = Math.floor(f);
  const u = f - i;
  const w = [(-u * (u - 1) * (u - 2)) / 6, ((u + 1) * (u - 1) * (u - 2)) / 2, (-(u + 1) * u * (u - 2)) / 2, ((u + 1) * u * (u - 1)) / 6];
  const out: [number, number, number] = [0, 0, 0];
  for (let k = 0; k < 4; k++) {
    const row = CHIRON_TABLE.xyz[i - 1 + k]!;
    for (let c = 0; c < 3; c++) out[c]! += w[k]! * row[c]!;
  }
  return out;
}

/**
 * Chiron (2060) : longitude géocentrique apparente (écliptique vraie de la date), à partir d'une table
 * héliocentrique précalculée par intégration numérique (scripts/build-chiron-table.ts), avec correction
 * du temps de lumière. L'aberration annuelle (≤ 0,006°) est négligée. Hors 1900-2100 : null.
 */
export function chironLongitude(utcMs: number): number | null {
  if (utcMs < CHIRON_RANGE.from || utcMs > CHIRON_RANGE.to) return null;
  const time = Astronomy.MakeTime(new Date(utcMs));
  const e = Astronomy.HelioVector(Astronomy.Body.Earth, time);
  const c = Math.cos(OBLIQUITY_J2000), s = Math.sin(OBLIQUITY_J2000);
  const earth = [e.x, e.y * c + e.z * s, -e.y * s + e.z * c];
  let h = chironHelio(utcMs);
  const dist = Math.hypot(h[0] - earth[0]!, h[1] - earth[1]!, h[2] - earth[2]!);
  h = chironHelio(utcMs - dist * LIGHT_DAYS_PER_AU * DAY_MS);
  const d = [h[0] - earth[0]!, h[1] - earth[1]!, h[2] - earth[2]!] as const;
  const eqj = new Astronomy.Vector(d[0], d[1] * c - d[2] * s, d[1] * s + d[2] * c, time);
  return norm360(Astronomy.Ecliptic(eqj).elon);
}
