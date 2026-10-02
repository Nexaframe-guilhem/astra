import { z } from 'zod';
import { engineMetaSchema } from '../shared/meta.js';
import { SIGNS } from '../shared/zodiac.js';

export const signIdSchema = z.enum(SIGNS);
const dmsSchema = z.object({ degrees: z.number().int(), minutes: z.number().int(), seconds: z.number().int() });

/** Position zodiacale commune (planète, point, angle, cuspide). */
export const zodiacPointSchema = z.object({
  longitude: z.number().min(0).lt(360),
  sign: signIdSchema,
  signIndex: z.number().int().min(0).max(11),
  degreeInSign: z.number(),
  dms: dmsSchema,
});

export const contentKeysSchema = z.record(z.string(), z.string());

export const bodyPositionSchema = zodiacPointSchema.extend({
  id: z.string(),
  latitude: z.number().nullable(),
  /** Vitesse en longitude, °/jour. */
  speed: z.number(),
  retrograde: z.boolean(),
  house: z.number().int().min(1).max(12),
  contentKeys: contentKeysSchema,
});

export const anglePointSchema = zodiacPointSchema.extend({
  id: z.string(),
  contentKeys: contentKeysSchema,
});

export const houseCuspSchema = zodiacPointSchema.extend({
  house: z.number().int().min(1).max(12),
  contentKeys: contentKeysSchema,
});

export const aspectSchema = z.object({
  a: z.string(),
  b: z.string(),
  type: z.enum(['conjunction', 'sextile', 'square', 'trine', 'opposition']),
  exactAngle: z.number(),
  angle: z.number(),
  orb: z.number(),
  applying: z.boolean().nullable(),
  contentKeys: contentKeysSchema,
});

export const astrologyResultSchema = z.object({
  meta: engineMetaSchema,
  zodiac: z.literal('tropical'),
  houseSystem: z.enum(['placidus', 'whole-sign', 'equal', 'porphyry']),
  /** Planètes + nœuds. */
  bodies: z.record(z.string(), bodyPositionSchema),
  angles: z.object({
    ascendant: anglePointSchema,
    midheaven: anglePointSchema,
    descendant: anglePointSchema,
    imumCoeli: anglePointSchema,
  }),
  houses: z.array(houseCuspSchema).length(12),
  aspects: z.array(aspectSchema),
  distribution: z.object({
    elements: z.record(z.string(), z.array(z.string())),
    modalities: z.record(z.string(), z.array(z.string())),
  }),
  warnings: z.array(z.string()),
});
