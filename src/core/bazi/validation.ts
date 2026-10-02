import { z } from 'zod';
import { engineMetaSchema } from '../shared/meta.js';
import { BRANCHES, BRANCH_ANIMAL, ELEMENTS, STEMS, TEN_GODS } from './data.js';

const stem = z.object({ id: z.enum(STEMS), hanzi: z.string(), element: z.enum(ELEMENTS), yang: z.boolean() });
const branch = z.object({ id: z.enum(BRANCHES), hanzi: z.string(), element: z.enum(ELEMENTS), yang: z.boolean(), animal: z.enum(BRANCH_ANIMAL) });
const pillar = z.object({
  stem, branch,
  /** Dix dieux du tronc visible (null pour le maître du jour lui-même). */
  stemGod: z.enum(TEN_GODS).nullable(),
  hiddenStems: z.array(z.object({ id: z.enum(STEMS), element: z.enum(ELEMENTS), god: z.enum(TEN_GODS) })),
  contentKey: z.string(),
});

export const baziResultSchema = z.object({
  meta: engineMetaSchema,
  pillars: z.object({ year: pillar, month: pillar, day: pillar, hour: pillar }),
  localTime: z.string(),
  dayMaster: z.object({ stem: z.enum(STEMS), element: z.enum(ELEMENTS), yang: z.boolean(), seasonalState: z.enum(['prosperous', 'strong', 'resting', 'trapped', 'dead']), contentKeys: z.object({ dayMaster: z.string(), seasonal: z.string() }) }),
  elements: z.object({
    /** Les huit caractères visibles (4 troncs + 4 branches). */
    visible: z.record(z.enum(ELEMENTS), z.number().int()),
    /** Avec les troncs cachés des branches. */
    withHidden: z.record(z.enum(ELEMENTS), z.number().int()),
    balance: z.array(z.object({ element: z.enum(ELEMENTS), state: z.enum(['excess', 'missing']), contentKey: z.string() })),
  }),
  yearAnimal: z.object({ id: z.enum(BRANCH_ANIMAL), contentKey: z.string() }),
  tenGods: z.array(z.object({ god: z.enum(TEN_GODS), count: z.number().int(), contentKey: z.string() })),
  sex: z.enum(['female', 'male']).nullable(),
  luck: z.object({
    forward: z.boolean(),
    startAge: z.number(),
    pillars: z.array(z.object({ stem: z.enum(STEMS), branch: z.enum(BRANCHES), hanzi: z.string(), startAge: z.number(), startYear: z.number().int(), stemGod: z.enum(TEN_GODS) })),
  }).nullable(),
  warnings: z.array(z.string()),
});
export type BaziResult = z.infer<typeof baziResultSchema>;
