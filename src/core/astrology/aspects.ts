import { separation } from '../shared/angles.js';

export const ASPECTS = {
  conjunction: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  opposition: 180,
} as const;
export type AspectId = keyof typeof ASPECTS;

export interface AspectPoint {
  id: string;
  longitude: number;
  /** °/jour ; null pour les points sans vitesse significative (angles). */
  speed: number | null;
}

export interface AspectCalc {
  a: string;
  b: string;
  type: AspectId;
  exactAngle: number;
  /** Séparation réelle entre les deux points. */
  angle: number;
  /** Écart à l'aspect exact (toujours positif). */
  orb: number;
  /** true = l'aspect se forme, false = il se défait, null = indéterminé (point fixe). */
  applying: boolean | null;
}

export function findAspects(points: AspectPoint[], orbs: Record<AspectId, number>): AspectCalc[] {
  const result: AspectCalc[] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const p = points[i]!;
      const q = points[j]!;
      const angle = separation(p.longitude, q.longitude);
      let best: AspectCalc | null = null;
      for (const [type, exact] of Object.entries(ASPECTS) as [AspectId, number][]) {
        const orb = Math.abs(angle - exact);
        if (orb <= orbs[type] && (!best || orb < best.orb)) {
          best = { a: p.id, b: q.id, type, exactAngle: exact, angle, orb, applying: null };
        }
      }
      if (best && !(p.speed === null && q.speed === null)) {
        if (p.speed !== null && q.speed !== null) {
          // Projection à +1 minute : l'orbe diminue-t-il ?
          const dt = 1 / 1440;
          const future = separation(p.longitude + p.speed * dt, q.longitude + q.speed * dt);
          best.applying = Math.abs(future - best.exactAngle) < best.orb;
        }
        result.push(best);
      }
    }
  }
  return result;
}

