/**
 * Catalogue exhaustif des clés de contenu que les moteurs peuvent produire, avec un titre
 * lisible et une priorité de rédaction. Sert à l'école de cahier de rédaction, et aux tests
 * à garantir qu'aucune clé produite n'est inconnue.
 */
import { SIGNS } from '../core/shared/zodiac.js';
import { ACTIVATION_POINTS, CENTERS, CHANNELS } from '../core/human-design/data.js';
import { label } from './repository.js';
import { GRAHAS, NAKSHATRAS } from '../core/jyotish/data.js';
import { HOUSE12_BODIES, RETROGRADE_PLANETS } from '../core/karmic/index.js';
import { MATRIX_POSITIONS, POSITIONS_WITH_ARCANA_TEXT } from '../core/destiny-matrix/types.js';

export interface CatalogEntry {
  key: string;
  domain: 'astrology' | 'humanDesign' | 'numerology' | 'destinyMatrix' | 'jyotish' | 'karmic';
  title: string;
  /** 1 = utilisé en tête de bilan ; 2 = détail affiché ; 3 = approfondissement. */
  priority: 1 | 2 | 3;
}

const BODIES = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'northNode', 'southNode'];
const ANGLES = ['ascendant', 'midheaven', 'descendant', 'imumCoeli'];
const ASPECTS = ['conjunction', 'sextile', 'square', 'trine', 'opposition'];
const ASPECT_POINTS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'ascendant', 'midheaven'];
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];
const HD = {
  types: ['manifestor', 'generator', 'manifesting-generator', 'projector', 'reflector'],
  strategies: ['to-inform', 'to-respond', 'wait-for-the-invitation', 'wait-a-lunar-cycle'],
  authorities: ['emotional', 'sacral', 'splenic', 'ego-manifested', 'ego-projected', 'self-projected', 'mental', 'lunar'],
  profiles: ['1-3', '1-4', '2-4', '2-5', '3-5', '3-6', '4-6', '4-1', '5-1', '5-2', '6-2', '6-3'],
  definitions: ['none', 'single', 'split', 'triple-split', 'quadruple-split'],
};

export function buildContentCatalog(locale = 'fr'): CatalogEntry[] {
  const L = (id: string) => label(id, locale);
  const out: CatalogEntry[] = [];
  const add = (domain: CatalogEntry['domain'], key: string, title: string, priority: CatalogEntry['priority']) => out.push({ key, domain, title, priority });

  // Astrologie
  for (const s of SIGNS) add('astrology', `astrology.signs.${s}`, L(s), 2);
  for (const b of BODIES) add('astrology', `astrology.bodies.${b}`, L(b), 2);
  for (const a of ANGLES) add('astrology', `astrology.angles.${a}`, L(a), 2);
  for (let h = 1; h <= 12; h++) add('astrology', `astrology.houses.${h}`, `Maison ${h}`, 2);
  for (const a of ASPECTS) add('astrology', `astrology.aspects.${a}`, L(a), 2);
  for (const b of BODIES) for (const s of SIGNS) add('astrology', `astrology.bodyInSign.${b}.${s}`, `${L(b)} en ${L(s)}`, ['sun', 'moon'].includes(b) ? 1 : 2);
  for (const a of ANGLES) for (const s of SIGNS) add('astrology', `astrology.angleInSign.${a}.${s}`, `${L(a)} en ${L(s)}`, a === 'ascendant' ? 1 : 3);
  for (const b of BODIES) for (let h = 1; h <= 12; h++) add('astrology', `astrology.bodyInHouse.${b}.${h}`, `${L(b)} en maison ${h}`, 3);
  for (let h = 1; h <= 12; h++) for (const s of SIGNS) add('astrology', `astrology.houseInSign.${h}.${s}`, `Maison ${h} en ${L(s)}`, 3);
  for (let i = 0; i < ASPECT_POINTS.length; i++) {
    for (let j = i + 1; j < ASPECT_POINTS.length; j++) {
      for (const a of ASPECTS) {
        const [p, q] = [ASPECT_POINTS[i]!, ASPECT_POINTS[j]!];
        add('astrology', `astrology.aspectPairs.${p}.${a}.${q}`, `${L(p)} ${L(a).toLowerCase()} ${L(q)}`, 3);
      }
    }
  }

  // Human Design
  for (const t of HD.types) add('humanDesign', `humanDesign.types.${t}`, `Type ${L(t)}`, 1);
  for (const s of HD.strategies) add('humanDesign', `humanDesign.strategies.${s}`, `Stratégie : ${L(s)}`, 1);
  for (const a of HD.authorities) add('humanDesign', `humanDesign.authorities.${a}`, `Autorité ${L(a)}`, 1);
  for (const p of HD.profiles) add('humanDesign', `humanDesign.profiles.${p}`, `Profil ${p.replace('-', '/')}`, 1);
  for (const d of HD.definitions) add('humanDesign', `humanDesign.definitions.${d}`, `Définition ${L(d)}`, 2);
  for (const c of CENTERS) for (const st of ['defined', 'open']) add('humanDesign', `humanDesign.centers.${c}.${st}`, `${L(c)} ${L(st)}`, 2);
  for (const [a, b] of CHANNELS) add('humanDesign', `humanDesign.channels.${a}-${b}`, `Canal ${a}-${b}`, 2);
  for (let g = 1; g <= 64; g++) add('humanDesign', `humanDesign.gates.${g}`, `Porte ${g}`, 2);
  for (let g = 1; g <= 64; g++) for (let l = 1; l <= 6; l++) add('humanDesign', `humanDesign.gateLines.${g}.${l}`, `Porte ${g}, ligne ${l}`, 3);
  for (const p of ACTIVATION_POINTS) add('humanDesign', `humanDesign.activationPoints.${p}`, L(p), 3);
  for (const angle of ['right', 'juxtaposition', 'left']) for (let g = 1; g <= 64; g++) add('humanDesign', `humanDesign.incarnationCrosses.${angle}.${g}`, `Croix ${L(angle).toLowerCase()}, Soleil en porte ${g}`, 2);
  for (const v of ['determination', 'environment', 'motivation', 'perspective']) for (let c = 1; c <= 6; c++) add('humanDesign', `humanDesign.variables.${v}.color${c}`, `${v} couleur ${c}`, 3);

  // Numérologie
  for (const kind of ['lifePath', 'expression', 'soulUrge', 'personality', 'maturity']) {
    for (const n of NUMBERS) add('numerology', `numerology.${kind}.${n}`, `${L(kind === 'personality' ? 'personalityNumber' : kind)} ${n}`, kind === 'lifePath' || kind === 'expression' ? 1 : 2);
  }
  for (const n of [...NUMBERS]) add('numerology', `numerology.birthday.${n}`, `Jour de naissance ${n}`, 2);
  for (const kind of ['personalYear', 'personalMonth', 'personalDay']) for (const n of NUMBERS) add('numerology', `numerology.${kind}.${n}`, `${L(kind)} ${n}`, kind === 'personalYear' ? 2 : 3);
  for (const n of [13, 14, 16, 19]) add('numerology', `numerology.karmicDebt.${n}`, `Dette karmique ${n}`, 2);
  for (let n = 1; n <= 9; n++) add('numerology', `numerology.karmicLessons.${n}`, `Leçon karmique ${n}`, 3);
  for (const kind of ['lifeCycles', 'pinnacles']) for (const n of NUMBERS) add('numerology', `numerology.${kind}.${n}`, `${kind === 'lifeCycles' ? 'Cycle de vie' : 'Réalisation'} ${n}`, 3);
  for (let n = 0; n <= 8; n++) add('numerology', `numerology.challenges.${n}`, `Défi ${n}`, 3);

  // Matrice du destin
  for (let n = 1; n <= 22; n++) add('destinyMatrix', `destinyMatrix.arcana.${n}`, `Arcane ${n} : ${L(`arcana${n}`)}`, 1);
  for (const p of MATRIX_POSITIONS) add('destinyMatrix', `destinyMatrix.positions.${p}`, L(`matrix.${p}`), 2);
  for (const p of POSITIONS_WITH_ARCANA_TEXT) for (let n = 1; n <= 22; n++) add('destinyMatrix', `destinyMatrix.positionArcana.${p}.${n}`, `${L(`matrix.${p}`)} : arcane ${n}`, 3);

  // Jyotish
  for (const s of SIGNS) add('jyotish', `jyotish.lagna.${s}`, `Lagna en ${L(s)}`, 1);
  for (const g of GRAHAS) add('jyotish', `jyotish.grahas.${g}`, L(g), 1);
  for (const nk of NAKSHATRAS) add('jyotish', `jyotish.nakshatras.${nk}`, `Nakshatra ${L(`nakshatra.${nk}`)}`, 1);
  for (const g of GRAHAS) add('jyotish', `jyotish.dashas.${g}`, `Mahadasha de ${L(g)}`, 1);
  for (const g of GRAHAS) for (const s of SIGNS) add('jyotish', `jyotish.grahaInRashi.${g}.${s}`, `${L(g)} en ${L(s)}`, 2);
  for (const g of GRAHAS) for (let h = 1; h <= 12; h++) add('jyotish', `jyotish.grahaInBhava.${g}.${h}`, `${L(g)} en maison ${h}`, 3);

  // Astrologie karmique
  add('karmic', 'karmic.intro', 'L’astrologie karmique', 1);
  const KARMIC_POINTS = [['nodes', 'Nœud Nord'], ['saturn', 'Saturne'], ['chiron', 'Chiron'], ['lilith', 'Lilith']] as const;
  for (const [k, name] of KARMIC_POINTS) for (const s of SIGNS) add('karmic', `karmic.${k}.${s}`, `${name} en ${L(s)} (lecture karmique)`, 1);
  for (const [k, name] of KARMIC_POINTS) for (let h = 1; h <= 12; h++) add('karmic', `karmic.${k}House.${h}`, `${name} en maison ${h} (lecture karmique)`, 2);
  for (const p of RETROGRADE_PLANETS) add('karmic', `karmic.retrograde.${p}`, `${L(p)} rétrograde`, 2);
  for (const b of HOUSE12_BODIES) add('karmic', `karmic.house12.${b}`, `${L(b)} en maison 12`, 3);

  return out;
}
