/**
 * Moteur numérologique : arithmétique pure, entièrement paramétrée par NumerologySettings.
 */
import { ALPHABETS, BASE_VOWELS } from './alphabets.js';
import type { NumerologyInput, NumerologySettings } from './types.js';

export interface Reduction {
  value: number;
  compound: number;
  chain: number[];
  isMaster: boolean;
  karmicDebt: number | null;
}

export function digitSum(n: number): number {
  return String(Math.abs(n)).split('').reduce((s, c) => s + Number(c), 0);
}

export function reduce(n: number, s: NumerologySettings, preserveMasters = s.preserveMasterNumbers): Reduction {
  const chain = [n];
  let v = n;
  while (v > 9 && !(preserveMasters && s.masterNumbers.includes(v))) {
    v = digitSum(v);
    chain.push(v);
  }
  const debt = chain.slice(0, -1).find((x) => s.karmicDebtNumbers.includes(x)) ?? null;
  return { value: v, compound: n, chain, isMaster: s.masterNumbers.includes(v), karmicDebt: debt };
}

/** Réduit complètement à un chiffre (pour les calculs d'âges et de défis). */
export function toSingleDigit(n: number): number {
  let v = n;
  while (v > 9) v = digitSum(v);
  return v;
}

/** Normalise un nom : accents, ligatures, tirets, ponctuation. Retourne les parties en majuscules A-Z. */
export function normalizeNameParts(raw: string, s: NumerologySettings): string[] {
  let text = raw;
  text = text.replace(/[œŒ]/g, 'OE').replace(/[æÆ]/g, 'AE').replace(/ß/g, 'SS');
  if (s.normalizeAccents) text = text.normalize('NFD').replace(/\p{M}/gu, '');
  text = text.toUpperCase();
  text = s.ignoreHyphens ? text.replace(/[-‐‑]/g, '') : text.replace(/[-‐‑]/g, ' ');
  return text
    .split(/\s+/)
    .map((p) => p.replace(/[^A-Z]/g, ''))
    .filter(Boolean);
}

export function isVowel(part: string, index: number, s: NumerologySettings): boolean {
  const ch = part[index]!;
  if (BASE_VOWELS.has(ch)) return true;
  if (ch !== 'Y') return false;
  if (s.yAsVowel === 'always') return true;
  if (s.yAsVowel === 'never') return false;
  const prev = part[index - 1];
  const next = part[index + 1];
  return !(prev && BASE_VOWELS.has(prev)) && !(next && BASE_VOWELS.has(next));
}

type LetterFilter = 'all' | 'vowels' | 'consonants';

function nameNumber(parts: string[], filter: LetterFilter, s: NumerologySettings): Reduction {
  const table = ALPHABETS[s.method];
  const partSums = parts.map((part) => {
    let sum = 0;
    for (let i = 0; i < part.length; i++) {
      const vowel = isVowel(part, i, s);
      if (filter === 'vowels' && !vowel) continue;
      if (filter === 'consonants' && vowel) continue;
      sum += table[part[i]!] ?? 0;
    }
    return sum;
  });
  const compound = s.nameReduction === 'perName'
    ? partSums.reduce((acc, x) => acc + (x === 0 ? 0 : reduce(x, s).value), 0)
    : partSums.reduce((a, b) => a + b, 0);
  const r = reduce(compound, s);
  // Une dette karmique peut aussi apparaître dans la somme d'une partie (convention "par nom").
  if (r.karmicDebt === null && s.nameReduction === 'perName') {
    for (const x of partSums) {
      const d = reduce(x, s).karmicDebt;
      if (d !== null) return { ...r, karmicDebt: d };
    }
  }
  return r;
}

export interface Cycle {
  index: number;
  value: number;
  fromAge: number;
  toAge: number | null;
}

export interface RawNumerology {
  parts: string[];
  lifePath: Reduction;
  expression: Reduction;
  soulUrge: Reduction;
  personality: Reduction;
  maturity: Reduction;
  birthday: Reduction & { day: number };
  personalYear: Reduction;
  personalMonth: Reduction;
  personalDay: Reduction;
  inclusionGrid: Record<string, number>;
  karmicLessons: number[];
  lifeCycles: Cycle[];
  pinnacles: Cycle[];
  challenges: Cycle[];
}

function parseDate(date: string): { year: number; month: number; day: number } {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return { year, month, day };
}

export function computeNumerologyRaw(input: NumerologyInput, s: NumerologySettings): RawNumerology {
  const lastName = s.useBirthLastName && input.birthLastName ? input.birthLastName : input.lastName;
  const fullName = [input.firstName, s.includeMiddleNames ? input.middleNames ?? '' : '', lastName].join(' ');
  const parts = normalizeNameParts(fullName, s);

  const { year, month, day } = parseDate(input.birthDate);
  const m = reduce(month, s).value;
  const d = reduce(day, s).value;
  const y = reduce(year, s).value;

  const lifePath = s.lifePathMethod === 'components'
    ? reduce(m + d + y, s)
    : reduce(digitSum(year) + digitSum(month) + digitSum(day), s);

  const expression = nameNumber(parts, 'all', s);
  const soulUrge = nameNumber(parts, 'vowels', s);
  const personality = nameNumber(parts, 'consonants', s);
  const maturity = reduce(lifePath.value + expression.value, s);
  const birthday = { ...reduce(day, s), karmicDebt: s.karmicDebtNumbers.includes(day) ? day : null, day };

  const ref = parseDate(input.referenceDate);
  const personalYear = reduce(m + d + reduce(ref.year, s).value, s);
  const personalMonth = reduce(personalYear.value + reduce(ref.month, s).value, s);
  const personalDay = reduce(personalMonth.value + reduce(ref.day, s).value, s);

  const table = ALPHABETS[s.method];
  const inclusionGrid: Record<string, number> = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [String(i + 1), 0]));
  for (const ch of parts.join('')) {
    const v = toSingleDigit(table[ch] ?? 0);
    if (v > 0) inclusionGrid[String(v)]! += 1;
  }
  const karmicLessons = Object.entries(inclusionGrid).filter(([, c]) => c === 0).map(([n]) => Number(n));

  // Cycles : âges de transition basés sur le chemin de vie réduit à un chiffre (36 - CV).
  const firstEnd = 36 - toSingleDigit(lifePath.value);
  const pin = [reduce(m + d, s).value, reduce(d + y, s).value];
  pin.push(reduce(pin[0]! + pin[1]!, s).value, reduce(m + y, s).value);
  const pinnacles: Cycle[] = pin.map((value, i) => ({
    index: i + 1,
    value,
    fromAge: i === 0 ? 0 : firstEnd + 9 * (i - 1) + 1,
    toAge: i === 3 ? null : firstEnd + 9 * i,
  }));
  const sm = toSingleDigit(m), sd = toSingleDigit(d), sy = toSingleDigit(y);
  const ch = [Math.abs(sm - sd), Math.abs(sd - sy)];
  ch.push(Math.abs(ch[0]! - ch[1]!), Math.abs(sm - sy));
  const challenges: Cycle[] = ch.map((value, i) => ({ ...pinnacles[i]!, value }));
  const lifeCycles: Cycle[] = [
    { index: 1, value: m, fromAge: 0, toAge: firstEnd },
    { index: 2, value: d, fromAge: firstEnd + 1, toAge: firstEnd + 27 },
    { index: 3, value: y, fromAge: firstEnd + 28, toAge: null },
  ];

  return {
    parts, lifePath, expression, soulUrge, personality, maturity, birthday,
    personalYear, personalMonth, personalDay, inclusionGrid, karmicLessons, lifeCycles, pinnacles, challenges,
  };
}
