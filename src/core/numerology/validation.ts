import { z } from 'zod';
import { engineMetaSchema } from '../shared/meta.js';

/** Un nombre réduit garde toute sa chaîne de réduction (ex. 38 -> 11), utile pour l'audit et les dettes karmiques. */
export const reducedNumberSchema = z.object({
  value: z.number().int(),
  /** Somme avant réduction. */
  compound: z.number().int(),
  chain: z.array(z.number().int()),
  isMaster: z.boolean(),
  karmicDebt: z.number().int().nullable(),
  contentKey: z.string(),
});

const cycle = z.object({
  index: z.number().int(),
  value: z.number().int(),
  fromAge: z.number().int(),
  toAge: z.number().int().nullable(),
  contentKey: z.string(),
});

export const numerologyResultSchema = z.object({
  meta: engineMetaSchema,
  method: z.enum(['pythagorean', 'chaldean']),
  /** Nom exactement utilisé pour les calculs, après normalisation. */
  normalizedName: z.object({ parts: z.array(z.string()), letters: z.string() }),
  lifePath: reducedNumberSchema,
  expression: reducedNumberSchema,
  soulUrge: reducedNumberSchema,
  personality: reducedNumberSchema,
  maturity: reducedNumberSchema,
  birthday: reducedNumberSchema.extend({ day: z.number().int() }),
  personalCycles: z.object({
    referenceDate: z.string(),
    personalYear: reducedNumberSchema,
    personalMonth: reducedNumberSchema,
    personalDay: reducedNumberSchema,
  }),
  masterNumbers: z.array(z.object({ number: z.number().int(), source: z.string() })),
  karmicDebt: z.array(z.object({ number: z.number().int(), source: z.string(), contentKey: z.string() })),
  karmicLessons: z.array(z.object({ number: z.number().int(), contentKey: z.string() })),
  /** Grille d'inclusion : nombre de lettres par valeur 1 à 9. */
  inclusionGrid: z.record(z.string(), z.number().int()),
  cycles: z.object({
    lifeCycles: z.array(cycle),
    pinnacles: z.array(cycle),
    challenges: z.array(cycle),
  }),
  warnings: z.array(z.string()),
});
