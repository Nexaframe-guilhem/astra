import { buildMeta } from '../shared/meta.js';
import type { Cycle, Reduction, RawNumerology } from './engine.js';
import type { NumerologyInput, NumerologyResult, NumerologySettings } from './types.js';

export const NUMEROLOGY_ENGINE = 'astra-numerology';
export const NUMEROLOGY_ENGINE_VERSION = '0.1.0';

const withKey = (r: Reduction, name: string) => ({ ...r, contentKey: `numerology.${name}.${r.value}` });
const cycles = (list: Cycle[], name: string) => list.map((c) => ({ ...c, contentKey: `numerology.${name}.${c.value}` }));

export function normalizeNumerology(
  raw: RawNumerology,
  input: NumerologyInput,
  s: NumerologySettings,
  now?: Date,
  convention: { preset: string; customized: boolean } = { preset: 'custom', customized: true },
): NumerologyResult {
  const core: Array<[string, Reduction]> = [
    ['lifePath', raw.lifePath], ['expression', raw.expression], ['soulUrge', raw.soulUrge],
    ['personality', raw.personality], ['maturity', raw.maturity], ['birthday', raw.birthday],
  ];
  return {
    meta: buildMeta({
      engine: NUMEROLOGY_ENGINE,
      engineVersion: NUMEROLOGY_ENGINE_VERSION,
      dependencies: {},
      settings: { convention: convention.preset, customized: convention.customized, ...s },
      hashedInput: input,
      now,
    }),
    method: s.method,
    normalizedName: { parts: raw.parts, letters: raw.parts.join('') },
    lifePath: withKey(raw.lifePath, 'lifePath'),
    expression: withKey(raw.expression, 'expression'),
    soulUrge: withKey(raw.soulUrge, 'soulUrge'),
    personality: withKey(raw.personality, 'personality'),
    maturity: withKey(raw.maturity, 'maturity'),
    birthday: { ...withKey(raw.birthday, 'birthday'), day: raw.birthday.day },
    personalCycles: {
      referenceDate: input.referenceDate,
      personalYear: withKey(raw.personalYear, 'personalYear'),
      personalMonth: withKey(raw.personalMonth, 'personalMonth'),
      personalDay: withKey(raw.personalDay, 'personalDay'),
    },
    masterNumbers: core.filter(([, r]) => r.isMaster).map(([source, r]) => ({ number: r.value, source })),
    karmicDebt: core
      .filter(([source, r]) => r.karmicDebt !== null && source !== 'maturity')
      .map(([source, r]) => ({ number: r.karmicDebt!, source, contentKey: `numerology.karmicDebt.${r.karmicDebt}` })),
    karmicLessons: raw.karmicLessons.map((n) => ({ number: n, contentKey: `numerology.karmicLessons.${n}` })),
    inclusionGrid: raw.inclusionGrid,
    cycles: {
      lifeCycles: cycles(raw.lifeCycles, 'lifeCycles'),
      pinnacles: cycles(raw.pinnacles, 'pinnacles'),
      challenges: cycles(raw.challenges, 'challenges'),
    },
    warnings: raw.parts.length === 0 ? ['EMPTY_NAME: aucune lettre exploitable dans le nom.'] : [],
  };
}
