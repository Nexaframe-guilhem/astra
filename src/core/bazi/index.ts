import type { BirthData } from '../birth-data/types.js';
import { round } from '../shared/angles.js';
import { buildMeta, RUNTIME_VERSIONS } from '../shared/meta.js';
import {
  BRANCHES, BRANCH_ANIMAL, BRANCH_ELEMENT, BRANCH_HANZI, ELEMENTS, HIDDEN_STEMS, STEMS, STEM_HANZI, TEN_GODS,
  branchYang, seasonalState, stemElement, stemYang, tenGod, type ElementId,
} from './data.js';
import { computeBaziRaw, DEFAULT_BAZI_SETTINGS, luckPillars, type BaziSettings, type RawPillar } from './engine.js';
import type { BaziResult } from './validation.js';

export { baziResultSchema, type BaziResult } from './validation.js';
export { DEFAULT_BAZI_SETTINGS, dayCycleIndex, type BaziSettings } from './engine.js';
export * from './data.js';

export const BAZI_ENGINE = 'astra-bazi';
export const BAZI_ENGINE_VERSION = '0.1.0';

/** Point d'entrée public du moteur BaZi. `sex` (facultatif) ne sert qu'aux piliers de chance. */
export function calculateBazi(birth: BirthData, sex: 'female' | 'male' | null = null, overrides: Partial<BaziSettings> = {}, now?: Date): BaziResult {
  const settings: BaziSettings = { ...DEFAULT_BAZI_SETTINGS, ...overrides };
  const utcMs = Date.parse(birth.utc);
  const raw = computeBaziRaw(utcMs, birth.latitude, birth.longitude, birth.utcOffsetMinutes, settings);
  const dm = raw.day.stem;

  const pillar = (p: RawPillar, which: 'year' | 'month' | 'day' | 'hour') => ({
    stem: { id: STEMS[p.stem]!, hanzi: STEM_HANZI[p.stem]!, element: stemElement(p.stem), yang: stemYang(p.stem) },
    branch: { id: BRANCHES[p.branch]!, hanzi: BRANCH_HANZI[p.branch]!, element: BRANCH_ELEMENT[p.branch]!, yang: branchYang(p.branch), animal: BRANCH_ANIMAL[p.branch]! },
    stemGod: which === 'day' ? null : tenGod(dm, p.stem),
    hiddenStems: HIDDEN_STEMS[p.branch]!.map((s) => { const i = STEMS.indexOf(s); return { id: s, element: stemElement(i), god: tenGod(dm, i) }; }),
    contentKey: which === 'day' ? `bazi.dayPillar.${STEMS[p.stem]}-${BRANCHES[p.branch]}` : `bazi.pillars.${which}`,
  });
  const pillars = { year: pillar(raw.year, 'year'), month: pillar(raw.month, 'month'), day: pillar(raw.day, 'day'), hour: pillar(raw.hour, 'hour') };
  const all = Object.values(pillars);

  const zero = () => Object.fromEntries(ELEMENTS.map((e) => [e, 0])) as Record<ElementId, number>;
  const visible = zero(), withHidden = zero();
  for (const p of all) {
    visible[p.stem.element]++; visible[p.branch.element]++;
    withHidden[p.stem.element]++;
    for (const h of p.hiddenStems) withHidden[h.element]++;
  }
  const balance = ELEMENTS.flatMap((e) => {
    const state = visible[e] === 0 ? 'missing' as const : visible[e] >= 3 ? 'excess' as const : null;
    return state ? [{ element: e, state, contentKey: `bazi.elementBalance.${e}.${state}` }] : [];
  });

  const godCount = new Map<string, number>();
  for (const p of all) {
    if (p.stemGod) godCount.set(p.stemGod, (godCount.get(p.stemGod) ?? 0) + 1);
    const main = p.hiddenStems[0]!.god;
    godCount.set(main, (godCount.get(main) ?? 0) + 1);
  }
  const tenGods = TEN_GODS.filter((g) => godCount.has(g)).map((g) => ({ god: g, count: godCount.get(g)!, contentKey: `bazi.tenGods.${g}` }));

  const state = seasonalState(stemElement(dm), BRANCH_ELEMENT[raw.month.branch]!);
  const birthYear = new Date(utcMs).getUTCFullYear() + (new Date(utcMs).getUTCMonth() + 0.5) / 12;
  const luck = sex ? (() => {
    const l = luckPillars(utcMs, raw, sex);
    return {
      forward: l.forward,
      startAge: round(l.startAge, 2),
      pillars: l.pillars.map((p) => ({
        stem: STEMS[p.stem]!, branch: BRANCHES[p.branch]!, hanzi: STEM_HANZI[p.stem]! + BRANCH_HANZI[p.branch]!,
        startAge: round(p.startAge, 2), startYear: Math.floor(birthYear + p.startAge), stemGod: tenGod(dm, p.stem),
      })),
    };
  })() : null;

  const warnings: string[] = [];
  const localH = Number(raw.localTime.slice(11, 13)) + Number(raw.localTime.slice(14, 16)) / 60;
  const toEdge = Math.min(...[1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23].map((b) => Math.min(Math.abs(localH - b), 24 - Math.abs(localH - b))));
  if (toEdge < 10 / 60) warnings.push(`HOUR_BOUNDARY: la naissance est à ${Math.round(toEdge * 60)} min d'un changement de double heure ; une heure imprécise peut changer le pilier de l'heure.`);

  return {
    meta: buildMeta({
      engine: BAZI_ENGINE,
      engineVersion: BAZI_ENGINE_VERSION,
      dependencies: { 'astronomy-engine': RUNTIME_VERSIONS['astronomy-engine'] },
      settings: { ...settings },
      hashedInput: { utc: birth.utc, latitude: birth.latitude, longitude: birth.longitude, utcOffsetMinutes: birth.utcOffsetMinutes, sex },
      now,
    }),
    pillars,
    localTime: raw.localTime,
    dayMaster: { stem: STEMS[dm]!, element: stemElement(dm), yang: stemYang(dm), seasonalState: state, contentKeys: { dayMaster: `bazi.dayMaster.${STEMS[dm]}`, seasonal: `bazi.seasonal.${state}` } },
    elements: { visible, withHidden, balance },
    yearAnimal: { id: BRANCH_ANIMAL[raw.year.branch]!, contentKey: `bazi.animals.${BRANCH_ANIMAL[raw.year.branch]}` },
    tenGods,
    sex,
    luck,
    warnings,
  };
}
