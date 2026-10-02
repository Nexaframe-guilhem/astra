import { z } from 'zod';
import { engineMetaSchema } from '../shared/meta.js';
import { ACTIVATION_POINTS, CENTERS } from './data.js';

const contentKeys = z.record(z.string(), z.string());

export const activationSchema = z.object({
  point: z.enum(ACTIVATION_POINTS),
  longitude: z.number(),
  gate: z.number().int().min(1).max(64),
  line: z.number().int().min(1).max(6),
  color: z.number().int().min(1).max(6),
  tone: z.number().int().min(1).max(6),
  base: z.number().int().min(1).max(5),
  gateBoundaryDistance: z.number(),
  lineBoundaryDistance: z.number(),
  contentKeys,
});

export const sideSchema = z.object({
  /** Instant UTC de la carte (naissance pour Personnalité, 88° solaires avant pour Design). */
  utc: z.string(),
  activations: z.array(activationSchema).length(13),
});

const idWithKey = <T extends z.ZodTypeAny>(id: T) => z.object({ id, contentKey: z.string() });

export const humanDesignResultSchema = z.object({
  meta: engineMetaSchema,
  type: idWithKey(z.enum(['manifestor', 'generator', 'manifesting-generator', 'projector', 'reflector'])),
  strategy: idWithKey(z.enum(['to-inform', 'to-respond', 'wait-for-the-invitation', 'wait-a-lunar-cycle'])),
  authority: idWithKey(z.enum(['emotional', 'sacral', 'splenic', 'ego-manifested', 'ego-projected', 'self-projected', 'mental', 'lunar'])),
  profile: z.object({
    id: z.string(),
    personalityLine: z.number().int(),
    designLine: z.number().int(),
    contentKey: z.string(),
  }),
  definition: idWithKey(z.enum(['none', 'single', 'split', 'triple-split', 'quadruple-split'])),
  centers: z.record(
    z.enum(CENTERS),
    z.object({ defined: z.boolean(), activeGates: z.array(z.number().int()), contentKey: z.string() }),
  ),
  channels: z.array(z.object({
    id: z.string(),
    gates: z.tuple([z.number().int(), z.number().int()]),
    centers: z.tuple([z.enum(CENTERS), z.enum(CENTERS)]),
    contentKey: z.string(),
  })),
  gates: z.array(z.object({
    gate: z.number().int(),
    center: z.enum(CENTERS),
    activatedBy: z.array(z.object({ side: z.enum(['personality', 'design']), point: z.enum(ACTIVATION_POINTS), line: z.number().int() })),
    inChannel: z.boolean(),
    contentKey: z.string(),
  })),
  personality: sideSchema,
  design: sideSchema.extend({ solarArcDegrees: z.number() }),
  incarnationCross: z.object({
    angle: z.enum(['right', 'juxtaposition', 'left']),
    gates: z.object({
      personalitySun: z.number().int(),
      personalityEarth: z.number().int(),
      designSun: z.number().int(),
      designEarth: z.number().int(),
    }),
    /** Identifiant stable, ex. "right:13/7|1/2". Le nom de la croix vient du référentiel de contenus. */
    id: z.string(),
    contentKey: z.string(),
  }),
  variables: z.object({
    notation: z.string(),
    determination: z.object({ arrow: z.enum(['left', 'right']), color: z.number().int(), tone: z.number().int(), contentKey: z.string() }),
    environment: z.object({ arrow: z.enum(['left', 'right']), color: z.number().int(), tone: z.number().int(), contentKey: z.string() }),
    motivation: z.object({ arrow: z.enum(['left', 'right']), color: z.number().int(), tone: z.number().int(), contentKey: z.string() }),
    perspective: z.object({ arrow: z.enum(['left', 'right']), color: z.number().int(), tone: z.number().int(), contentKey: z.string() }),
  }),
  warnings: z.array(z.string()),
});
