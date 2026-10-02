/** Utilitaires angulaires purs (degrés). Aucune dépendance externe. */

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

/** Ramène un angle dans [0, 360). */
export function norm360(angle: number): number {
  const a = angle % 360;
  return a < 0 ? a + 360 : a;
}

/** Différence signée b - a dans (-180, 180]. */
export function signedDelta(a: number, b: number): number {
  let d = norm360(b - a);
  if (d > 180) d -= 360;
  return d;
}

/** Distance angulaire minimale entre deux longitudes, dans [0, 180]. */
export function separation(a: number, b: number): number {
  return Math.abs(signedDelta(a, b));
}

/** Arrondi stable pour la sérialisation (évite le bruit flottant dans le JSON stocké). */
export function round(value: number, decimals = 6): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

export interface Dms {
  degrees: number;
  minutes: number;
  seconds: number;
}

/** Décompose un angle positif en degrés / minutes / secondes entières (arrondi à la seconde). */
export function toDms(angle: number): Dms {
  let totalSeconds = Math.round(angle * 3600);
  const degrees = Math.floor(totalSeconds / 3600);
  totalSeconds -= degrees * 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  return { degrees, minutes, seconds };
}
