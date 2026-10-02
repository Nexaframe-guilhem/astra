import { round } from '../shared/angles.js';
import { RUNTIME_VERSIONS, buildMeta } from '../shared/meta.js';
import { DELTA_T_MODEL } from '../ephemeris/index.js';
import { CENTERS, CENTER_GATES, GATE_CENTER, type CenterId } from './data.js';
import { DESIGN_SOLAR_ARC, type RawActivation, type RawHumanDesign, type TypeId } from './engine.js';
import type { Activation, HumanDesignResult, HumanDesignSettings } from './types.js';

export const HUMAN_DESIGN_ENGINE = 'astra-human-design';
export const HUMAN_DESIGN_ENGINE_VERSION = '0.1.0';

const STRATEGY: Record<TypeId, HumanDesignResult['strategy']['id']> = {
  manifestor: 'to-inform',
  generator: 'to-respond',
  'manifesting-generator': 'to-respond',
  projector: 'wait-for-the-invitation',
  reflector: 'wait-a-lunar-cycle',
};

function activation(a: RawActivation): Activation {
  return {
    point: a.point,
    longitude: round(a.longitude, 6),
    gate: a.gate,
    line: a.line,
    color: a.color,
    tone: a.tone,
    base: a.base,
    gateBoundaryDistance: round(a.gateBoundaryDistance, 4),
    lineBoundaryDistance: round(a.lineBoundaryDistance, 4),
    contentKeys: {
      gate: `humanDesign.gates.${a.gate}`,
      line: `humanDesign.gateLines.${a.gate}.${a.line}`,
      point: `humanDesign.activationPoints.${a.point}`,
    },
  };
}

function variable(a: RawActivation, name: string) {
  return {
    arrow: a.tone <= 3 ? ('left' as const) : ('right' as const),
    color: a.color,
    tone: a.tone,
    contentKey: `humanDesign.variables.${name}.color${a.color}`,
  };
}

export function normalizeHumanDesign(raw: RawHumanDesign, settings: HumanDesignSettings, hashedInput: unknown, now?: Date): HumanDesignResult {
  const p = (point: string) => raw.personality.find((a) => a.point === point)!;
  const d = (point: string) => raw.design.find((a) => a.point === point)!;
  const profileId = `${raw.profile.personalityLine}/${raw.profile.designLine}`;
  const channelGates = new Set(raw.channels.flat());

  const centers = Object.fromEntries(CENTERS.map((c) => [c, {
    defined: raw.definedCenters.has(c),
    activeGates: CENTER_GATES[c].filter((g) => raw.activeGates.has(g)).sort((a, b) => a - b),
    contentKey: `humanDesign.centers.${c}.${raw.definedCenters.has(c) ? 'defined' : 'open'}`,
  }])) as HumanDesignResult['centers'];

  const gates = [...raw.activeGates].sort((a, b) => a - b).map((gate) => ({
    gate,
    center: GATE_CENTER[gate]!,
    activatedBy: [
      ...raw.personality.filter((a) => a.gate === gate).map((a) => ({ side: 'personality' as const, point: a.point, line: a.line })),
      ...raw.design.filter((a) => a.gate === gate).map((a) => ({ side: 'design' as const, point: a.point, line: a.line })),
    ],
    inChannel: channelGates.has(gate),
    contentKey: `humanDesign.gates.${gate}`,
  }));

  const cross = {
    personalitySun: p('sun').gate,
    personalityEarth: p('earth').gate,
    designSun: d('sun').gate,
    designEarth: d('earth').gate,
  };
  const ds = d('sun'), dn = d('northNode'), ps = p('sun'), pn = p('northNode');
  const vars = {
    determination: variable(ds, 'determination'),
    environment: variable(dn, 'environment'),
    motivation: variable(ps, 'motivation'),
    perspective: variable(pn, 'perspective'),
  };
  const arrow = (x: { arrow: string }) => (x.arrow === 'left' ? 'L' : 'R');

  return {
    meta: buildMeta({
      engine: HUMAN_DESIGN_ENGINE,
      engineVersion: HUMAN_DESIGN_ENGINE_VERSION,
      dependencies: { 'astronomy-engine': RUNTIME_VERSIONS['astronomy-engine'], deltaT: DELTA_T_MODEL },
      settings: { ...settings },
      hashedInput,
      now,
    }),
    type: { id: raw.type, contentKey: `humanDesign.types.${raw.type}` },
    strategy: { id: STRATEGY[raw.type], contentKey: `humanDesign.strategies.${STRATEGY[raw.type]}` },
    authority: { id: raw.authority, contentKey: `humanDesign.authorities.${raw.authority}` },
    profile: { id: profileId, ...raw.profile, contentKey: `humanDesign.profiles.${profileId.replace('/', '-')}` },
    definition: { id: raw.definition, contentKey: `humanDesign.definitions.${raw.definition}` },
    centers,
    channels: raw.channels.map(([a, b]) => ({
      id: `${a}-${b}`,
      gates: [a, b] as [number, number],
      centers: [GATE_CENTER[a]!, GATE_CENTER[b]!] as [CenterId, CenterId],
      contentKey: `humanDesign.channels.${a}-${b}`,
    })),
    gates,
    personality: { utc: new Date(raw.personalityUtcMs).toISOString(), activations: raw.personality.map(activation) },
    design: { utc: new Date(raw.designUtcMs).toISOString(), solarArcDegrees: DESIGN_SOLAR_ARC, activations: raw.design.map(activation) },
    incarnationCross: {
      angle: raw.angle,
      gates: cross,
      id: `${raw.angle}:${cross.personalitySun}/${cross.personalityEarth}|${cross.designSun}/${cross.designEarth}`,
      contentKey: `humanDesign.incarnationCrosses.${raw.angle}.${cross.personalitySun}`,
    },
    variables: { notation: `${arrow(vars.determination)}${arrow(vars.environment)} ${arrow(vars.motivation)}${arrow(vars.perspective)}`, ...vars },
    warnings: boundaryWarnings(raw),
  };
}

/** Seuil (°) en dessous duquel une activation est signalée comme proche d'une limite de porte. */
export const GATE_BOUNDARY_WARNING_DEG = 0.05;

function boundaryWarnings(raw: RawHumanDesign): string[] {
  const out: string[] = [];
  for (const [side, list] of [['personality', raw.personality], ['design', raw.design]] as const) {
    for (const a of list) {
      if (a.gateBoundaryDistance < GATE_BOUNDARY_WARNING_DEG) {
        out.push(`GATE_BOUNDARY: ${side}.${a.point} porte ${a.gate} à ${a.gateBoundaryDistance.toFixed(4)}° d'une limite de porte (sensible à l'heure exacte et à la convention de roue).`);
      }
    }
  }
  return out;
}
