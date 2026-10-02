/**
 * Moteur Human Design : 13 activations Personnalité (naissance) et Design
 * (instant où le Soleil apparent était exactement 88° en arrière), puis
 * dérivation du BodyGraph (centres, canaux, type, autorité, profil, définition…).
 */
import {
  bodyLongitude, findSunLongitudeBefore, nodeLongitude, type NodeType, type PlanetId,
} from '../ephemeris/index.js';
import { norm360 } from '../shared/angles.js';
import {
  ACTIVATION_POINTS, CENTERS, CHANNELS, GATE_CENTER, GATE_ORDER, MOTOR_CENTERS, PROFILE_ANGLES,
  WHEEL_START_LONGITUDE, type ActivationPoint, type CenterId,
} from './data.js';

export const DESIGN_SOLAR_ARC = 88;

export interface RawActivation {
  point: ActivationPoint;
  longitude: number;
  gate: number;
  line: number;
  color: number;
  tone: number;
  base: number;
  /** Distance (°) à la limite de porte la plus proche : faible => sensible à l'heure de naissance et au modèle. */
  gateBoundaryDistance: number;
  lineBoundaryDistance: number;
}

/**
 * Position sur la roue. Calcul en unités entières de "base" (1/5 de ton) pour éviter
 * toute dérive flottante : 64 portes × 6 lignes × 6 couleurs × 6 tons × 5 bases = 69 120 unités / 360°.
 */
export function longitudeToActivation(longitude: number): Omit<RawActivation, 'point'> {
  const offset = norm360(longitude - WHEEL_START_LONGITUDE);
  const units = Math.floor(offset * 192); // 69120 / 360
  const gateIndex = Math.floor(units / 1080);
  const inGate = units % 1080;
  const gatePos = offset - gateIndex * 5.625;
  const linePos = gatePos % 0.9375;
  return {
    gateBoundaryDistance: Math.min(gatePos, 5.625 - gatePos),
    lineBoundaryDistance: Math.min(linePos, 0.9375 - linePos),
    longitude,
    gate: GATE_ORDER[gateIndex]!,
    line: Math.floor(inGate / 180) + 1,
    color: Math.floor((inGate % 180) / 30) + 1,
    tone: Math.floor((inGate % 30) / 5) + 1,
    base: (inGate % 5) + 1,
  };
}

export function activationsAt(utcMs: number, nodeType: NodeType): RawActivation[] {
  const sun = bodyLongitude('sun', utcMs);
  const north = nodeLongitude(nodeType, utcMs);
  const lon: Record<ActivationPoint, number> = {
    sun,
    earth: norm360(sun + 180),
    northNode: north,
    southNode: norm360(north + 180),
  } as Record<ActivationPoint, number>;
  for (const p of ACTIVATION_POINTS) {
    if (!(p in lon)) lon[p] = bodyLongitude(p as PlanetId, utcMs);
  }
  return ACTIVATION_POINTS.map((point) => ({ point, ...longitudeToActivation(lon[point]) }));
}

export function designMoment(birthUtcMs: number): number {
  const target = norm360(bodyLongitude('sun', birthUtcMs) - DESIGN_SOLAR_ARC);
  return findSunLongitudeBefore(target, birthUtcMs, [80, 100]);
}

export type TypeId = 'manifestor' | 'generator' | 'manifesting-generator' | 'projector' | 'reflector';
export type AuthorityId =
  | 'emotional' | 'sacral' | 'splenic' | 'ego-manifested' | 'ego-projected'
  | 'self-projected' | 'mental' | 'lunar';
export type DefinitionId = 'none' | 'single' | 'split' | 'triple-split' | 'quadruple-split';

export interface RawHumanDesign {
  personalityUtcMs: number;
  designUtcMs: number;
  personality: RawActivation[];
  design: RawActivation[];
  activeGates: Set<number>;
  channels: Array<readonly [number, number]>;
  definedCenters: Set<CenterId>;
  type: TypeId;
  authority: AuthorityId;
  definition: DefinitionId;
  profile: { personalityLine: number; designLine: number };
  angle: 'right' | 'juxtaposition' | 'left';
}

function components(defined: Set<CenterId>, edges: Array<[CenterId, CenterId]>): CenterId[][] {
  const adj = new Map<CenterId, Set<CenterId>>();
  for (const c of defined) adj.set(c, new Set());
  for (const [a, b] of edges) {
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  }
  const seen = new Set<CenterId>();
  const groups: CenterId[][] = [];
  for (const start of CENTERS.filter((c) => defined.has(c))) {
    if (seen.has(start)) continue;
    const group: CenterId[] = [];
    const stack = [start];
    seen.add(start);
    while (stack.length) {
      const c = stack.pop()!;
      group.push(c);
      for (const n of adj.get(c) ?? []) if (!seen.has(n)) { seen.add(n); stack.push(n); }
    }
    groups.push(group);
  }
  return groups;
}

export function computeHumanDesignRaw(birthUtcMs: number, nodeType: NodeType): RawHumanDesign {
  const designUtcMs = designMoment(birthUtcMs);
  const personality = activationsAt(birthUtcMs, nodeType);
  const design = activationsAt(designUtcMs, nodeType);

  const activeGates = new Set<number>([...personality, ...design].map((a) => a.gate));
  const channels = CHANNELS.filter(([a, b]) => activeGates.has(a) && activeGates.has(b));
  const edges = channels.map(([a, b]) => [GATE_CENTER[a]!, GATE_CENTER[b]!] as [CenterId, CenterId]);
  const definedCenters = new Set<CenterId>(edges.flat());
  const groups = components(definedCenters, edges);
  const groupOf = (c: CenterId) => groups.find((g) => g.includes(c));
  const connected = (a: CenterId, b: CenterId) => definedCenters.has(a) && definedCenters.has(b) && groupOf(a) === groupOf(b);
  const motorToThroat = MOTOR_CENTERS.some((m) => connected(m, 'throat'));

  let type: TypeId;
  if (definedCenters.size === 0) type = 'reflector';
  else if (definedCenters.has('sacral')) type = motorToThroat ? 'manifesting-generator' : 'generator';
  else if (motorToThroat) type = 'manifestor';
  else type = 'projector';

  let authority: AuthorityId;
  if (definedCenters.has('solarPlexus')) authority = 'emotional';
  else if (definedCenters.has('sacral')) authority = 'sacral';
  else if (definedCenters.has('spleen')) authority = 'splenic';
  else if (definedCenters.has('heart')) authority = type === 'manifestor' ? 'ego-manifested' : 'ego-projected';
  else if (definedCenters.has('g')) authority = 'self-projected';
  else if (type === 'reflector') authority = 'lunar';
  else authority = 'mental';

  const definitionIds: DefinitionId[] = ['none', 'single', 'split', 'triple-split', 'quadruple-split'];
  const definition = definitionIds[groups.length]!;

  const pSun = personality.find((a) => a.point === 'sun')!;
  const dSun = design.find((a) => a.point === 'sun')!;
  const profile = { personalityLine: pSun.line, designLine: dSun.line };
  const angle = PROFILE_ANGLES[`${profile.personalityLine}/${profile.designLine}`];
  if (!angle) throw new Error(`Profil impossible : ${profile.personalityLine}/${profile.designLine}`);

  return { personalityUtcMs: birthUtcMs, designUtcMs, personality, design, activeGates, channels, definedCenters, type, authority, definition, profile, angle };
}
