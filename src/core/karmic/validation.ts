import { z } from 'zod';
import { engineMetaSchema } from '../shared/meta.js';
import { SIGNS } from '../shared/zodiac.js';

const dms = z.object({ degrees: z.number().int(), minutes: z.number().int(), seconds: z.number().int() });
const placed = z.object({
  longitude: z.number().min(0).lt(360), sign: z.enum(SIGNS), signIndex: z.number().int(), degreeInSign: z.number(), dms,
  house: z.number().int().min(1).max(12),
  retrograde: z.boolean(),
  contentKeys: z.object({ sign: z.string(), house: z.string() }),
});

export const karmicResultSchema = z.object({
  meta: engineMetaSchema,
  contentKey: z.literal('karmic.intro'),
  nodes: z.object({ north: placed, south: placed.omit({ contentKeys: true }) }),
  saturn: placed,
  /** Null hors de la table 1900-2100. */
  chiron: placed.nullable(),
  lilith: placed,
  retrogrades: z.array(z.object({ id: z.string(), contentKey: z.string() })),
  house12: z.array(z.object({ id: z.string(), contentKey: z.string() })),
  warnings: z.array(z.string()),
});
export type KarmicResult = z.infer<typeof karmicResultSchema>;
