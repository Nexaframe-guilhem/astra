import type { z } from 'zod';
import type { NodeType } from '../ephemeris/index.js';
import type { AspectId } from './aspects.js';
import type { HouseSystem } from './houses.js';
import type { astrologyResultSchema, bodyPositionSchema, anglePointSchema, aspectSchema, houseCuspSchema } from './validation.js';

export type AstrologyResult = z.infer<typeof astrologyResultSchema>;
export type BodyPosition = z.infer<typeof bodyPositionSchema>;
export type AnglePoint = z.infer<typeof anglePointSchema>;
export type Aspect = z.infer<typeof aspectSchema>;
export type HouseCusp = z.infer<typeof houseCuspSchema>;

export interface AstrologySettings {
  houseSystem: HouseSystem;
  /** Repli si le système demandé est indéfini (latitudes polaires pour Placidus). */
  polarFallback: HouseSystem;
  nodeType: NodeType;
  orbs: Record<AspectId, number>;
  /** Points pris en compte pour les aspects. */
  aspectPoints: string[];
}

export const DEFAULT_ASTROLOGY_SETTINGS: AstrologySettings = {
  houseSystem: 'placidus',
  polarFallback: 'whole-sign',
  nodeType: 'true',
  orbs: { conjunction: 8, opposition: 8, trine: 7, square: 7, sextile: 5 },
  aspectPoints: ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'ascendant', 'midheaven'],
};
