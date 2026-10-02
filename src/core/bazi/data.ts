/** Tables du BaZi (Quatre Piliers) : troncs célestes, branches terrestres, troncs cachés. */
export const ELEMENTS = ['wood', 'fire', 'earth', 'metal', 'water'] as const;
export type ElementId = (typeof ELEMENTS)[number];

export const STEMS = ['jia', 'yi', 'bing', 'ding', 'wu', 'ji', 'geng', 'xin', 'ren', 'gui'] as const;
export type StemId = (typeof STEMS)[number];
export const STEM_HANZI = '甲乙丙丁戊己庚辛壬癸';
/** Élément et polarité d'un tronc : deux troncs par élément, yang puis yin. */
export const stemElement = (i: number): ElementId => ELEMENTS[Math.floor(i / 2)]!;
export const stemYang = (i: number): boolean => i % 2 === 0;

export const BRANCHES = ['zi', 'chou', 'yin', 'mao', 'chen', 'si', 'wu', 'wei', 'shen', 'you', 'xu', 'hai'] as const;
export type BranchId = (typeof BRANCHES)[number];
export const BRANCH_HANZI = '子丑寅卯辰巳午未申酉戌亥';
export const BRANCH_ANIMAL = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'] as const;
export const BRANCH_ELEMENT: ElementId[] = ['water', 'earth', 'wood', 'wood', 'earth', 'fire', 'fire', 'earth', 'metal', 'metal', 'earth', 'water'];
export const branchYang = (i: number): boolean => i % 2 === 0;

/** Troncs cachés (藏干), le principal en premier. */
export const HIDDEN_STEMS: StemId[][] = [
  ['gui'], ['ji', 'gui', 'xin'], ['jia', 'bing', 'wu'], ['yi'], ['wu', 'yi', 'gui'], ['bing', 'geng', 'wu'],
  ['ding', 'ji'], ['ji', 'ding', 'yi'], ['geng', 'ren', 'wu'], ['xin'], ['wu', 'xin', 'ding'], ['ren', 'jia'],
];

/** Cycle d'engendrement : bois → feu → terre → métal → eau → bois. */
const gen = (e: ElementId) => ELEMENTS[(ELEMENTS.indexOf(e) + 1) % 5]!;
/** Cycle de contrôle : bois → terre → eau → feu → métal → bois. */
const ctl = (e: ElementId) => ELEMENTS[(ELEMENTS.indexOf(e) + 2) % 5]!;

export const TEN_GODS = [
  'friend', 'robWealth', 'eatingGod', 'hurtingOfficer', 'indirectWealth', 'directWealth',
  'sevenKillings', 'directOfficer', 'indirectResource', 'directResource',
] as const;
export type TenGod = (typeof TEN_GODS)[number];

/** Dix dieux : relation d'un tronc au maître du jour (élément + même polarité ou non). */
export function tenGod(dayStem: number, other: number): TenGod {
  const dm = stemElement(dayStem), x = stemElement(other);
  const same = stemYang(dayStem) === stemYang(other);
  if (x === dm) return same ? 'friend' : 'robWealth';
  if (x === gen(dm)) return same ? 'eatingGod' : 'hurtingOfficer';
  if (x === ctl(dm)) return same ? 'indirectWealth' : 'directWealth';
  if (ctl(x) === dm) return same ? 'sevenKillings' : 'directOfficer';
  return same ? 'indirectResource' : 'directResource';
}

/** Force saisonnière (旺相休囚死) de l'élément du maître du jour selon l'élément de la branche du mois. */
export type SeasonalState = 'prosperous' | 'strong' | 'resting' | 'trapped' | 'dead';
export function seasonalState(dm: ElementId, season: ElementId): SeasonalState {
  if (dm === season) return 'prosperous';
  if (dm === gen(season)) return 'strong';
  if (season === gen(dm)) return 'resting';
  if (ctl(dm) === season) return 'trapped';
  return 'dead';
}
