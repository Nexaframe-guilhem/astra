import { z } from 'zod';
import { engineMetaSchema } from '../shared/meta.js';
import { SIGNS } from '../shared/zodiac.js';
import { GRAHAS, NAKSHATRAS } from './data.js';

const dms = z.object({ degrees: z.number().int(), minutes: z.number().int(), seconds: z.number().int() });
const nakshatra = z.object({ id: z.enum(NAKSHATRAS), index: z.number().int(), pada: z.number().int().min(1).max(4), lord: z.enum(GRAHAS) });
const period = z.object({ lord: z.enum(GRAHAS), start: z.string(), end: z.string() });

export const jyotishResultSchema = z.object({
  meta: engineMetaSchema,
  ayanamsa: z.object({ id: z.literal('lahiri'), value: z.number() }),
  lagna: z.object({
    longitude: z.number(), sign: z.enum(SIGNS), signIndex: z.number().int(), degreeInSign: z.number(), dms,
    nakshatra, navamsaSign: z.enum(SIGNS), contentKey: z.string(),
  }),
  grahas: z.array(z.object({
    id: z.enum(GRAHAS),
    longitude: z.number(),
    tropicalLongitude: z.number(),
    sign: z.enum(SIGNS), signIndex: z.number().int(), degreeInSign: z.number(), dms,
    house: z.number().int().min(1).max(12),
    retrograde: z.boolean(),
    nakshatra,
    navamsaSign: z.enum(SIGNS),
    dignity: z.enum(['exalted', 'debilitated', 'own', 'neutral']),
    contentKeys: z.object({ graha: z.string(), sign: z.string(), house: z.string(), nakshatra: z.string() }),
  })).length(9),
  dashas: z.object({
    system: z.literal('vimshottari'),
    yearDays: z.number(),
    balanceYears: z.number(),
    mahadashas: z.array(period.extend({ years: z.number(), antardashas: z.array(period), contentKey: z.string() })).length(9),
    current: z.object({ referenceDate: z.string(), mahadasha: z.enum(GRAHAS).nullable(), antardasha: z.enum(GRAHAS).nullable() }),
  }),
  warnings: z.array(z.string()),
});
export type JyotishResult = z.infer<typeof jyotishResultSchema>;
