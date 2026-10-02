/**
 * BaZi (Quatre Piliers du destin). Pilier de l'année changé à Lichun (Soleil à 315°), pilier du mois
 * par les douze « jie » (tous les 30° à partir de 315°), pilier du jour par le cycle sexagésimal continu,
 * pilier de l'heure par les doubles heures (23 h-1 h = zi). Jour et heure en heure solaire vraie par défaut.
 */
import { apparentSolarTimeHours, sunLongitudeTime, bodyLongitude } from '../ephemeris/index.js';
import { norm360 } from '../shared/angles.js';

export interface BaziSettings {
  /** Base horaire du jour et de l'heure : heure solaire vraie du lieu, ou heure légale. */
  timeBasis: 'true-solar' | 'clock';
  /** Changement de jour : à minuit (zi tardif rattaché au jour) ou à 23 h. */
  dayBoundary: 'midnight' | '23h';
}
export const DEFAULT_BAZI_SETTINGS: BaziSettings = { timeBasis: 'true-solar', dayBoundary: 'midnight' };

export interface RawPillar { stem: number; branch: number }
const DAY_MS = 86400000;
const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Julian Day Number (midi) d'une date civile grégorienne. */
export function jdn(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}
/** Index sexagésimal du jour (0 = jia-zi). Le 1er janvier 2000 est un jour wu-wu (54). */
export const dayCycleIndex = (y: number, m: number, d: number) => mod(jdn(y, m, d) + 49, 60);

export interface RawBazi {
  year: RawPillar; month: RawPillar; day: RawPillar; hour: RawPillar;
  /** Heure locale retenue pour le jour et l'heure (AAAA-MM-JJTHH:MM). */
  localTime: string;
  solarOffsetMinutes: number;
  /** Nombre de « jie » parcourus depuis Lichun (0 = mois du Tigre). */
  monthIndex: number;
  sunLongitude: number;
}

export function computeBaziRaw(utcMs: number, latitude: number, longitude: number, utcOffsetMinutes: number, settings: BaziSettings): RawBazi {
  // Année et mois : position du Soleil à l'instant de naissance.
  const sun = bodyLongitude('sun', utcMs);
  const monthIndex = Math.floor(norm360(sun - 315) / 30);
  const gYear = new Date(utcMs).getUTCFullYear();
  // Lichun tombe vers le 4 février : avant lui, on est encore dans l'année précédente.
  const lichun = sunLongitudeTime(315, Date.UTC(gYear, 0, 15), 60);
  const year = utcMs >= lichun ? gYear : gYear - 1;
  const yStem = mod(year - 4, 10), yBranch = mod(year - 4, 12);
  const mStem = mod((yStem % 5) * 2 + 2 + monthIndex, 10), mBranch = mod(2 + monthIndex, 12);

  // Jour et heure : heure solaire vraie du lieu (ou heure légale).
  let offsetMin = utcOffsetMinutes;
  if (settings.timeBasis === 'true-solar') {
    const utcH = (utcMs / 3600000) % 24;
    offsetMin = Math.round(mod(apparentSolarTimeHours(utcMs, latitude, longitude) - utcH + 12, 24) * 60 - 720);
  }
  const local = new Date(utcMs + offsetMin * 60000);
  const h = local.getUTCHours() + local.getUTCMinutes() / 60;
  const hBranch = mod(Math.floor((h + 1) / 2), 12);
  const dayIdx = dayCycleIndex(local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate());
  const nextDay = h >= 23 && settings.dayBoundary === '23h' ? 1 : 0;
  const dIdx = mod(dayIdx + nextDay, 60);
  // L'heure zi tardive (23 h-24 h) prend le tronc du zi du lendemain dans les deux conventions.
  const hourDayStem = mod(dayIdx + (h >= 23 ? 1 : 0), 10);
  const hStem = mod((hourDayStem % 5) * 2 + hBranch, 10);

  return {
    year: { stem: yStem, branch: yBranch },
    month: { stem: mStem, branch: mBranch },
    day: { stem: dIdx % 10, branch: dIdx % 12 },
    hour: { stem: hStem, branch: hBranch },
    localTime: local.toISOString().slice(0, 16),
    solarOffsetMinutes: offsetMin,
    monthIndex,
    sunLongitude: sun,
  };
}

/**
 * Piliers de chance (大运) : sens direct si (année yang et homme) ou (année yin et femme), inverse sinon.
 * Âge de départ = jours jusqu'au « jie » suivant (ou depuis le précédent) / 3, en années.
 */
export function luckPillars(utcMs: number, raw: RawBazi, sex: 'male' | 'female', count = 8) {
  const forward = (raw.year.stem % 2 === 0) === (sex === 'male');
  const nextJie = 315 + ((raw.monthIndex + 1) % 12) * 30;
  const prevJie = 315 + raw.monthIndex * 30;
  const termMs = forward ? sunLongitudeTime(norm360(nextJie), utcMs, 40) : sunLongitudeTime(norm360(prevJie), utcMs - 40 * DAY_MS, 40);
  const days = Math.abs(termMs - utcMs) / DAY_MS;
  const startAge = days / 3;
  const pillars = Array.from({ length: count }, (_, i) => {
    const step = forward ? i + 1 : -(i + 1);
    return { stem: mod(raw.month.stem + step, 10), branch: mod(raw.month.branch + step, 12), startAge: startAge + i * 10 };
  });
  return { forward, startAge, pillars };
}
