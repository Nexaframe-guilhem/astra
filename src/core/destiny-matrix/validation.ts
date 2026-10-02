import { z } from 'zod';
import { engineMetaSchema } from '../shared/meta.js';
import { MATRIX_POSITIONS } from './types.js';
import { POINT_IDS } from './engine.js';

const arcana = z.number().int().min(1).max(22);

export const destinyMatrixResultSchema = z.object({
  meta: engineMetaSchema,
  birthDate: z.string(),
  points: z.array(z.object({ id: z.enum(POINT_IDS), value: arcana, formula: z.string(), contentKey: z.string() })).length(POINT_IDS.length),
  purposes: z.object({ sky: arcana, earth: arcana, personal: arcana, male: arcana, female: arcana, social: arcana, spiritual: arcana }),
  positions: z.array(z.object({
    id: z.enum(MATRIX_POSITIONS),
    points: z.array(z.string()),
    values: z.array(arcana),
    contentKey: z.string(),
    arcanaContentKey: z.string().nullable(),
  })),
});
export type DestinyMatrixResult = z.infer<typeof destinyMatrixResultSchema>;
