/**
 * Schéma du profil complet, version 1.1 (1.1 : ajout de la Matrice du destin). Source unique de vérité :
 * - validation runtime (zod) côté serveur avant stockage ;
 * - export JSON Schema (scripts/export-schema.ts -> schema/profile.v1.json) pour Supabase / autres modules.
 */
import { z } from 'zod';
import { astrologyResultSchema } from '../astrology/validation.js';
import { birthDataSchema } from '../birth-data/types.js';
import { destinyMatrixResultSchema } from '../destiny-matrix/validation.js';
import { jyotishResultSchema } from '../jyotish/validation.js';
import { karmicResultSchema } from '../karmic/validation.js';
import { humanDesignResultSchema } from '../human-design/validation.js';
import { numerologyResultSchema } from '../numerology/validation.js';
import { SCHEMA_VERSION } from '../shared/meta.js';

export const identitySchema = z.object({
  firstName: z.string(),
  middleNames: z.string().nullable(),
  lastName: z.string(),
  birthLastName: z.string().nullable(),
});

export const profileSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  identity: identitySchema,
  birth: birthDataSchema,
  astrology: astrologyResultSchema,
  humanDesign: humanDesignResultSchema,
  numerology: numerologyResultSchema,
  destinyMatrix: destinyMatrixResultSchema,
  jyotish: jyotishResultSchema,
  karmic: karmicResultSchema,
  meta: z.object({
    builtAt: z.string(),
    /** Empreinte des entrées + paramètres de tous les moteurs (détection de recalcul nécessaire). */
    inputHash: z.string(),
  }),
});

export type Identity = z.infer<typeof identitySchema>;
export type Profile = z.infer<typeof profileSchema>;
