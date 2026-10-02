/**
 * Conventions numérologiques nommées. La convention utilisée est enregistrée dans
 * `meta.settings` de chaque résultat, ce qui permet d'en changer sans perdre la traçabilité.
 *
 * - `astra-standard` (défaut) : tradition pythagoricienne telle qu'enseignée dans la littérature
 *   de référence (Decoz, Millman) et dans la majorité des écoles francophones : réduction séparée
 *   du jour, du mois et de l'année, réduction par prénom/nom, nombres maîtres 11/22/33 conservés,
 *   dettes karmiques 13/14/16/19, Y compté comme voyelle (usage français).
 * - `decoz` : identique, mais Y voyelle seulement quand il sonne comme une voyelle (règle contextuelle).
 * - `simple` : variante des calculateurs grand public : somme de tous les chiffres de la date,
 *   Y consonne.
 * - `chaldean` : table chaldéenne (moins répandue en France), mêmes règles de réduction.
 */
import type { NumerologySettings } from './types.js';

const BASE: NumerologySettings = {
  method: 'pythagorean',
  masterNumbers: [11, 22, 33],
  preserveMasterNumbers: true,
  karmicDebtNumbers: [13, 14, 16, 19],
  normalizeAccents: true,
  ignoreHyphens: true,
  includeMiddleNames: true,
  useBirthLastName: true,
  yAsVowel: 'always',
  nameReduction: 'perName',
  lifePathMethod: 'components',
};

export const NUMEROLOGY_PRESETS = {
  'astra-standard': BASE,
  decoz: { ...BASE, yAsVowel: 'contextual' },
  simple: { ...BASE, yAsVowel: 'never', lifePathMethod: 'allDigits', nameReduction: 'total' },
  chaldean: { ...BASE, method: 'chaldean' },
} as const satisfies Record<string, NumerologySettings>;

export type NumerologyPreset = keyof typeof NUMEROLOGY_PRESETS;
