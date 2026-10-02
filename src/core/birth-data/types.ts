import { z } from 'zod';

/** Saisie brute (formulaire / API). Validée côté serveur avant tout calcul. */
export const birthInputSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  /** Prénoms secondaires, séparés par des espaces (optionnel). */
  middleNames: z.string().trim().max(200).optional(),
  lastName: z.string().trim().min(1).max(100),
  /** Nom de naissance si différent du nom d'usage (utile en numérologie). */
  birthLastName: z.string().trim().max(100).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu : AAAA-MM-JJ'),
  birthTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Format attendu : HH:MM'),
  birthPlace: z.string().trim().min(1).max(200),
  country: z.string().trim().max(100).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  /** Fuseau IANA. S'il est absent, il est déduit des coordonnées. */
  timezone: z.string().optional(),
  /**
   * Levée d'ambiguïté lors du passage heure d'été -> hiver (heure vécue deux fois).
   * Sans cette information, une heure ambiguë est refusée.
   */
  dstAmbiguity: z.enum(['earlier', 'later']).optional(),
});
export type BirthInput = z.infer<typeof birthInputSchema>;

/** Données de naissance normalisées : ce qui est stocké et passé aux moteurs. */
export const birthDataSchema = z.object({
  date: z.string(),
  time: z.string(),
  place: z.string(),
  country: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  timezoneSource: z.enum(['input', 'coordinates']),
  /** Décalage UTC en minutes effectivement appliqué à cette date (historique, été/hiver inclus). */
  utcOffsetMinutes: z.number(),
  /** Instant UTC de naissance, ISO 8601. Source de vérité pour tous les calculs. */
  utc: z.string(),
  /** Jour julien UT. */
  julianDayUT: z.number(),
  /** Fuseaux trouvés aux coordonnées (contrôle de cohérence avec le fuseau saisi). */
  timezonesAtCoordinates: z.array(z.string()),
  warnings: z.array(z.string()),
});
export type BirthData = z.infer<typeof birthDataSchema>;
