import { norm360, round, toDms, type Dms } from './angles.js';

export const SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;
export type SignId = (typeof SIGNS)[number];

export type ElementId = 'fire' | 'earth' | 'air' | 'water';
export type ModalityId = 'cardinal' | 'fixed' | 'mutable';

const ELEMENTS: ElementId[] = ['fire', 'earth', 'air', 'water'];
const MODALITIES: ModalityId[] = ['cardinal', 'fixed', 'mutable'];

export interface ZodiacPosition {
  sign: SignId;
  signIndex: number;
  /** Degré décimal dans le signe, [0, 30). */
  degreeInSign: number;
  dms: Dms;
}

export function zodiacPosition(longitude: number): ZodiacPosition {
  const lon = norm360(longitude);
  const signIndex = Math.floor(lon / 30) % 12;
  const degreeInSign = lon - signIndex * 30;
  return {
    sign: SIGNS[signIndex]!,
    signIndex,
    degreeInSign: round(degreeInSign, 6),
    dms: toDms(degreeInSign),
  };
}

export function elementOf(sign: SignId): ElementId {
  return ELEMENTS[SIGNS.indexOf(sign) % 4]!;
}

export function modalityOf(sign: SignId): ModalityId {
  return MODALITIES[SIGNS.indexOf(sign) % 3]!;
}
