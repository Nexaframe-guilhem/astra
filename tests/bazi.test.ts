/**
 * BaZi : cycle sexagésimal, piliers comparés à lunar-javascript (MIT) en heure légale, troncs cachés,
 * dix dieux, piliers de chance et heure solaire vraie.
 */
import { Solar } from 'lunar-javascript';
import { describe, expect, it } from 'vitest';
import { normalizeBirthData } from '../src/core/birth-data/normalize.js';
import { BRANCH_HANZI, STEM_HANZI, calculateBazi, baziResultSchema, dayCycleIndex, tenGod } from '../src/core/bazi/index.js';
import { computeBaziRaw, luckPillars } from '../src/core/bazi/engine.js';
import { REFERENCE_CASES } from './fixtures/reference-inputs.js';

const gz = (p: { stem: number; branch: number }) => STEM_HANZI[p.stem]! + BRANCH_HANZI[p.branch]!;
const wall = (ms: number) => { const d = new Date(ms); return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), 0] as const; };
/** lunar-javascript calcule les termes solaires en heure de Pékin : année et mois depuis l'instant converti en UTC+8. */
function oracle(utcMs: number, offsetMin: number) {
  const ym = Solar.fromYmdHms(...wall(utcMs + 8 * 3600000)).getLunar().getEightChar();
  const dh = Solar.fromYmdHms(...wall(utcMs + offsetMin * 60000)).getLunar().getEightChar();
  return { pillars: [ym.getYear(), ym.getMonth(), dh.getDay(), dh.getTime()].join(' '), dh };
}

describe('cycle sexagésimal', () => {
  it('1er janvier 2000 = wu-wu (戊午), 1er octobre 1949 = jia-zi (甲子)', () => {
    expect(dayCycleIndex(2000, 1, 1)).toBe(54);
    expect(dayCycleIndex(1949, 10, 1)).toBe(0);
  });
  it('dix dieux : Jia face aux dix troncs', () => {
    expect([...Array(10).keys()].map((i) => tenGod(0, i))).toEqual([
      'friend', 'robWealth', 'eatingGod', 'hurtingOfficer', 'indirectWealth', 'directWealth', 'sevenKillings', 'directOfficer', 'indirectResource', 'directResource',
    ]);
  });
});

describe('quatre piliers identiques à lunar-javascript (heure légale, jour à minuit)', () => {
  // Échantillon déterministe : 400 instants répartis sur 1901-2098, fuseaux de −10 h à +12 h.
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const cases = Array.from({ length: 400 }, () => ({
    utc: Math.floor((Date.UTC(1901, 0, 1) + rand() * (Date.UTC(2098, 0, 1) - Date.UTC(1901, 0, 1))) / 60000) * 60000,
    offset: Math.round(rand() * 22 - 10) * 60,
  }));
  it('400 naissances', () => {
    for (const { utc, offset } of cases) {
      const r = computeBaziRaw(utc, 0, 0, offset, { timeBasis: 'clock', dayBoundary: 'midnight' });
      expect([gz(r.year), gz(r.month), gz(r.day), gz(r.hour)].join(' ')).toBe(oracle(utc, offset).pillars);
    }
  });
  it('autour de Lichun 2024 (4 février 08:27 UTC) le pilier de l’année change', () => {
    const before = computeBaziRaw(Date.UTC(2024, 1, 4, 8, 20), 0, 0, 0, { timeBasis: 'clock', dayBoundary: 'midnight' });
    const after = computeBaziRaw(Date.UTC(2024, 1, 4, 8, 35), 0, 0, 0, { timeBasis: 'clock', dayBoundary: 'midnight' });
    expect(gz(before.year)).toBe('癸卯');
    expect(gz(after.year)).toBe('甲辰');
    expect(gz(after.month)).toBe('丙寅');
  });
});

describe('piliers de chance', () => {
  for (const [sex, code] of [['male', 1], ['female', 0]] as const) {
    it(`identiques à lunar-javascript (${sex === 'male' ? 'homme' : 'femme'}, 15 juin 1990 14:30 UTC+8)`, () => {
      const utc = Date.UTC(1990, 5, 15, 6, 30);
      const raw = computeBaziRaw(utc, 0, 0, 480, { timeBasis: 'clock', dayBoundary: 'midnight' });
      const ours = luckPillars(utc, raw, sex);
      const yun = Solar.fromYmdHms(1990, 6, 15, 14, 30, 0).getLunar().getEightChar().getYun(code, 2);
      expect(ours.pillars.slice(0, 8).map(gz)).toEqual(yun.getDaYun().slice(1, 9).map((d: any) => d.getGanZhi()));
      const theirsYears = yun.getStartYear() + yun.getStartMonth() / 12 + yun.getStartDay() / 365.25;
      expect(Math.abs(ours.startAge - theirsYears)).toBeLessThan(0.1);
    });
  }
});

describe.each(REFERENCE_CASES)('BaZi : $id', ({ input }) => {
  const { birth } = normalizeBirthData(input);
  const r = calculateBazi(birth, null, {}, new Date('2026-01-01T00:00:00Z'));
  const withSex = calculateBazi(birth, 'female', {}, new Date('2026-01-01T00:00:00Z'));

  it('respecte le schéma ; cycles seulement si le sexe est renseigné', () => {
    expect(baziResultSchema.safeParse(r).success).toBe(true);
    expect(baziResultSchema.safeParse(withSex).success).toBe(true);
    expect(r.luck).toBeNull();
    expect(withSex.luck?.pillars).toHaveLength(8);
  });
  it('heure solaire vraie : écart à l’heure UTC égal à la longitude ± équation du temps (≤ 17 min)', () => {
    const solar = Date.parse(`${r.localTime}:00Z`);
    const expected = Date.parse(birth.utc) + (birth.longitude / 15) * 3600000;
    expect(Math.abs(solar - expected)).toBeLessThan(17 * 60000 + 60000);
  });
  it('troncs cachés et dix dieux identiques à lunar-javascript (même pilier du jour)', () => {
    const dh = Solar.fromYmdHms(...wall(Date.parse(`${r.localTime}:00Z`))).getLunar().getEightChar();
    if (dh.getDay() !== r.pillars.day.stem.hanzi + r.pillars.day.branch.hanzi) return;
    const GOD: Record<string, string> = { 比肩: 'friend', 劫财: 'robWealth', 食神: 'eatingGod', 伤官: 'hurtingOfficer', 偏财: 'indirectWealth', 正财: 'directWealth', 七杀: 'sevenKillings', 正官: 'directOfficer', 偏印: 'indirectResource', 正印: 'directResource' };
    expect(r.pillars.month.hiddenStems.map((h) => STEM_HANZI['jia yi bing ding wu ji geng xin ren gui'.split(' ').indexOf(h.id)])).toEqual(
      // lunar-javascript : troncs cachés du mois calculé avec la même convention d'année et de mois
      Solar.fromYmdHms(...wall(Date.parse(birth.utc) + 8 * 3600000)).getLunar().getEightChar().getMonthHideGan(),
    );
    expect(r.pillars.hour.stemGod).toBe(GOD[dh.getTimeShiShenGan()]);
  });
});
