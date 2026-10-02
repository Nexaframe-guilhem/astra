import type { z } from 'zod';
import type { NodeType } from '../ephemeris/index.js';
import type { activationSchema, humanDesignResultSchema } from './validation.js';

export type HumanDesignResult = z.infer<typeof humanDesignResultSchema>;
export type Activation = z.infer<typeof activationSchema>;

export interface HumanDesignSettings {
  /** Nœud vrai (convention la plus répandue) ou moyen. À valider avec l'école. */
  nodeType: NodeType;
  designSolarArc: 88;
}

export const DEFAULT_HUMAN_DESIGN_SETTINGS: HumanDesignSettings = {
  nodeType: 'true',
  designSolarArc: 88,
};
