/** Données traditionnelles du Jyotish (domaine public). */
import type { SignId } from '../shared/zodiac.js';

export const GRAHAS = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'] as const;
export type GrahaId = (typeof GRAHAS)[number];

/** 27 nakshatras de 13°20′, avec leur maître (seigneur) dans l'ordre de Vimshottari. */
export const NAKSHATRAS = [
  'ashwini', 'bharani', 'krittika', 'rohini', 'mrigashira', 'ardra', 'punarvasu', 'pushya', 'ashlesha',
  'magha', 'purva-phalguni', 'uttara-phalguni', 'hasta', 'chitra', 'swati', 'vishakha', 'anuradha', 'jyeshtha',
  'mula', 'purva-ashadha', 'uttara-ashadha', 'shravana', 'dhanishta', 'shatabhisha', 'purva-bhadrapada', 'uttara-bhadrapada', 'revati',
] as const;
export type NakshatraId = (typeof NAKSHATRAS)[number];

/** Ordre et durées (années) de la Vimshottari dasha, 120 ans au total. */
export const DASHA_ORDER: GrahaId[] = ['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury'];
export const DASHA_YEARS: Record<GrahaId, number> = { ketu: 7, venus: 20, sun: 6, moon: 10, mars: 7, rahu: 18, jupiter: 16, saturn: 19, mercury: 17 };

export const nakshatraLord = (index: number): GrahaId => DASHA_ORDER[index % 9]!;

export const EXALTATION: Partial<Record<GrahaId, SignId>> = {
  sun: 'aries', moon: 'taurus', mars: 'capricorn', mercury: 'virgo', jupiter: 'cancer', venus: 'pisces', saturn: 'libra',
};
export const DEBILITATION: Partial<Record<GrahaId, SignId>> = {
  sun: 'libra', moon: 'scorpio', mars: 'cancer', mercury: 'pisces', jupiter: 'capricorn', venus: 'virgo', saturn: 'aries',
};
export const OWN_SIGNS: Partial<Record<GrahaId, SignId[]>> = {
  sun: ['leo'], moon: ['cancer'], mars: ['aries', 'scorpio'], mercury: ['gemini', 'virgo'],
  jupiter: ['sagittarius', 'pisces'], venus: ['taurus', 'libra'], saturn: ['capricorn', 'aquarius'],
};
export type Dignity = 'exalted' | 'debilitated' | 'own' | 'neutral';
