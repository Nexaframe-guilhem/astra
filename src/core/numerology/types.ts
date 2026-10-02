import type { z } from 'zod';
import type { NumerologyMethod } from './alphabets.js';
import type { numerologyResultSchema, reducedNumberSchema } from './validation.js';

export type NumerologyResult = z.infer<typeof numerologyResultSchema>;
export type ReducedNumber = z.infer<typeof reducedNumberSchema>;

/** Convention de calcul. Doit être validée par l'école ; elle est enregistrée avec chaque résultat. */
export interface NumerologySettings {
  method: NumerologyMethod;
  masterNumbers: number[];
  preserveMasterNumbers: boolean;
  karmicDebtNumbers: number[];
  normalizeAccents: boolean;
  ignoreHyphens: boolean;
  includeMiddleNames: boolean;
  /** Nom utilisé : nom de naissance (si fourni) ou nom d'usage. */
  useBirthLastName: boolean;
  /** Y voyelle : toujours (usage français), jamais, ou selon le contexte (pas de voyelle adjacente). */
  yAsVowel: 'always' | 'never' | 'contextual';
  /** Réduction du nom : chaque partie réduite puis additionnée, ou somme totale réduite. */
  nameReduction: 'perName' | 'total';
  /** Chemin de vie : composantes (mois, jour, année) réduites puis additionnées, ou somme de tous les chiffres. */
  lifePathMethod: 'components' | 'allDigits';
}

export const DEFAULT_NUMEROLOGY_PRESET = 'astra-standard';

export interface NumerologyInput {
  firstName: string;
  middleNames?: string | undefined;
  lastName: string;
  birthLastName?: string | undefined;
  birthDate: string;
  /** Date de référence (AAAA-MM-JJ) pour les cycles personnels : explicite pour rester déterministe. */
  referenceDate: string;
}
