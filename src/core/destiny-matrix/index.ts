import { buildMeta } from '../shared/meta.js';
import { AstraError } from '../shared/errors.js';
import { computeMatrixRaw, POINT_IDS, type PointId } from './engine.js';
import {
  DESTINY_MATRIX_CONVENTION, POSITIONS_WITH_ARCANA_TEXT, type DestinyMatrixInput, type MatrixPosition, type MatrixPositionId,
} from './types.js';
import type { DestinyMatrixResult } from './validation.js';

export * from './types.js';
export { reduceArcana, computeMatrixRaw, POINT_IDS } from './engine.js';
export { destinyMatrixResultSchema, type DestinyMatrixResult } from './validation.js';

export const DESTINY_MATRIX_ENGINE = 'astra-destiny-matrix';
export const DESTINY_MATRIX_ENGINE_VERSION = '0.1.0';

/** Point d'entrée public : Matrice du destin à partir de la date de naissance. */
export function calculateDestinyMatrix(input: DestinyMatrixInput, now?: Date): DestinyMatrixResult {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.birthDate);
  if (!m) throw new AstraError('INVALID_INPUT', 'Date de naissance attendue au format AAAA-MM-JJ', {});
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const raw = computeMatrixRaw(day, month, year);
  const p = raw.points;

  const position = (id: MatrixPositionId, points: string[], values: number[]): MatrixPosition => ({
    id,
    points,
    values,
    contentKey: `destinyMatrix.positions.${id}`,
    arcanaContentKey: POSITIONS_WITH_ARCANA_TEXT.includes(id) && values.length === 1 ? `destinyMatrix.positionArcana.${id}.${values[0]}` : null,
  });
  const u = raw.purposes;
  const positions: MatrixPosition[] = [
    position('personality', ['A'], [p.A]),
    position('talents', ['B'], [p.B]),
    position('material', ['C'], [p.C]),
    position('karmicTask', ['D'], [p.D]),
    position('center', ['E'], [p.E]),
    position('karmicTail', ['D', 'R', 'J'], [p.D, p.R, p.J]),
    position('love', ['K'], [p.K]),
    position('money', ['M'], [p.M]),
    position('paternalLine', ['F', 'F1', 'F2', 'I2', 'I1', 'I'], [p.F, p.F1, p.F2, p.I2, p.I1, p.I]),
    position('maternalLine', ['G', 'G1', 'G2', 'H2', 'H1', 'H'], [p.G, p.G1, p.G2, p.H2, p.H1, p.H]),
    position('personalPurpose', ['ciel', 'terre'], [u.personal]),
    position('socialPurpose', ['masculin', 'féminin'], [u.social]),
    position('spiritualPurpose', ['personnelle', 'sociale'], [u.spiritual]),
  ];

  return {
    meta: buildMeta({
      engine: DESTINY_MATRIX_ENGINE,
      engineVersion: DESTINY_MATRIX_ENGINE_VERSION,
      dependencies: {},
      settings: { convention: DESTINY_MATRIX_CONVENTION },
      hashedInput: input,
      now,
    }),
    birthDate: input.birthDate,
    points: POINT_IDS.map((id: PointId) => ({ id, value: p[id], formula: raw.formulas[id], contentKey: `destinyMatrix.arcana.${p[id]}` })),
    purposes: u,
    positions,
  };
}
