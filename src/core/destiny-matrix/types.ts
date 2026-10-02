import type { PointId } from './engine.js';

export const DESTINY_MATRIX_CONVENTION = 'astra-matrix';

/** Positions interprétées du bilan, chacune rattachée à un ou plusieurs points de la matrice. */
export const MATRIX_POSITIONS = [
  'personality', 'talents', 'material', 'karmicTask', 'center', 'karmicTail',
  'love', 'money', 'paternalLine', 'maternalLine', 'personalPurpose', 'socialPurpose', 'spiritualPurpose',
] as const;
export type MatrixPositionId = (typeof MATRIX_POSITIONS)[number];

/** Positions qui ont un texte par arcane (les autres n'ont qu'un texte de présentation). */
export const POSITIONS_WITH_ARCANA_TEXT: readonly MatrixPositionId[] = [
  'personality', 'talents', 'material', 'karmicTask', 'center', 'love', 'money', 'personalPurpose', 'socialPurpose', 'spiritualPurpose',
];

export interface DestinyMatrixInput {
  /** AAAA-MM-JJ */
  birthDate: string;
}

export interface MatrixPosition {
  id: MatrixPositionId;
  /** Points de la matrice qui composent la position (lettres), ou destination calculée. */
  points: string[];
  values: number[];
  contentKey: string;
  /** Texte de l'arcane dans cette position (une seule valeur), ou null. */
  arcanaContentKey: string | null;
}

export type { PointId };
