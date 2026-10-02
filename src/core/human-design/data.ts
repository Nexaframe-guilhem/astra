/**
 * Données de référence du BodyGraph (système Human Design standard publié).
 * Ces tables sont des FAITS structurels (quelle porte appartient à quel centre),
 * pas des textes d'interprétation. Elles sont vérifiées contre natalengine et
 * free-human-design dans tests/human-design.cross.test.ts.
 */

export const CENTERS = ['head', 'ajna', 'throat', 'g', 'heart', 'spleen', 'solarPlexus', 'sacral', 'root'] as const;
export type CenterId = (typeof CENTERS)[number];

export const MOTOR_CENTERS: readonly CenterId[] = ['sacral', 'solarPlexus', 'heart', 'root'];

/** Ordre des 64 portes sur la roue (Rave Mandala), en partant de la porte 41 à 302° de longitude tropicale. */
export const WHEEL_START_LONGITUDE = 302;
export const GATE_ORDER = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
  27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50,
  28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60,
] as const;

export const CENTER_GATES: Record<CenterId, number[]> = {
  head: [64, 61, 63],
  ajna: [47, 24, 4, 17, 43, 11],
  throat: [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16],
  g: [7, 1, 13, 10, 25, 15, 46, 2],
  heart: [21, 40, 26, 51],
  spleen: [48, 57, 44, 50, 32, 28, 18],
  solarPlexus: [6, 37, 22, 36, 30, 55, 49],
  sacral: [5, 14, 29, 59, 9, 3, 42, 27, 34],
  root: [53, 60, 52, 19, 39, 41, 58, 38, 54],
};

export const GATE_CENTER: Record<number, CenterId> = Object.fromEntries(
  Object.entries(CENTER_GATES).flatMap(([center, gates]) => gates.map((g) => [g, center as CenterId])),
);

/** Les 36 canaux, chacun défini par sa paire de portes. */
export const CHANNELS: ReadonlyArray<readonly [number, number]> = [
  [1, 8], [2, 14], [3, 60], [4, 63], [5, 15], [6, 59], [7, 31], [9, 52], [10, 20],
  [10, 34], [10, 57], [11, 56], [12, 22], [13, 33], [16, 48], [17, 62], [18, 58], [19, 49],
  [20, 34], [20, 57], [21, 45], [23, 43], [24, 61], [25, 51], [26, 44], [27, 50], [28, 38],
  [29, 46], [30, 41], [32, 54], [34, 57], [35, 36], [37, 40], [39, 55], [42, 53], [47, 64],
];

/** Les 13 points d'activation, dans l'ordre d'affichage traditionnel. */
export const ACTIVATION_POINTS = [
  'sun', 'earth', 'northNode', 'southNode', 'moon', 'mercury', 'venus',
  'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
] as const;
export type ActivationPoint = (typeof ACTIVATION_POINTS)[number];

export const PROFILE_ANGLES: Record<string, 'right' | 'juxtaposition' | 'left'> = {
  '1/3': 'right', '1/4': 'right', '2/4': 'right', '2/5': 'right', '3/5': 'right', '3/6': 'right', '4/6': 'right',
  '4/1': 'juxtaposition',
  '5/1': 'left', '5/2': 'left', '6/2': 'left', '6/3': 'left',
};
