/**
 * Orchestration : saisie -> données de naissance normalisées -> moteurs -> profil complet validé.
 * Fonction pure à `now` près (injectable pour les tests et la reproductibilité).
 */
import { calculateAstrology, type AstrologySettings } from '../astrology/index.js';
import { calculateDestinyMatrix } from '../destiny-matrix/index.js';
import { normalizeBirthData } from '../birth-data/normalize.js';
import { calculateJyotish, type JyotishSettings } from '../jyotish/index.js';
import { calculateHumanDesign, type HumanDesignSettings } from '../human-design/index.js';
import { calculateNumerology, type NumerologyPreset, type NumerologySettings } from '../numerology/index.js';
import { AstraError } from '../shared/errors.js';
import { SCHEMA_VERSION, sha256 } from '../shared/meta.js';
import { profileSchema, type Profile } from './schema.js';

export interface BuildProfileOptions {
  astrology?: Partial<AstrologySettings>;
  humanDesign?: Partial<HumanDesignSettings>;
  jyotish?: Partial<JyotishSettings>;
  numerology?: Partial<NumerologySettings> & { preset?: NumerologyPreset };
  /** Date de référence des cycles numérologiques personnels (AAAA-MM-JJ). Défaut : date de `now` (UTC). */
  referenceDate?: string;
  now?: Date;
}

export function buildProfile(rawInput: unknown, options: BuildProfileOptions = {}): Profile {
  const now = options.now ?? new Date();
  const { input, birth } = normalizeBirthData(rawInput);
  const referenceDate = options.referenceDate ?? now.toISOString().slice(0, 10);

  const astrology = calculateAstrology(birth, options.astrology, now);
  const humanDesign = calculateHumanDesign(birth, options.humanDesign, now);
  const numerology = calculateNumerology(
    {
      firstName: input.firstName,
      middleNames: input.middleNames,
      lastName: input.lastName,
      birthLastName: input.birthLastName,
      birthDate: input.birthDate,
      referenceDate,
    },
    options.numerology,
    now,
  );
  const destinyMatrix = calculateDestinyMatrix({ birthDate: input.birthDate }, now);
  const jyotish = calculateJyotish(birth, options.jyotish, now, referenceDate);

  const profile: Profile = {
    schemaVersion: SCHEMA_VERSION,
    identity: {
      firstName: input.firstName,
      middleNames: input.middleNames ?? null,
      lastName: input.lastName,
      birthLastName: input.birthLastName ?? null,
    },
    birth,
    astrology,
    humanDesign,
    numerology,
    destinyMatrix,
    jyotish,
    meta: {
      builtAt: now.toISOString(),
      inputHash: sha256([astrology.meta.inputHash, humanDesign.meta.inputHash, numerology.meta.inputHash, destinyMatrix.meta.inputHash, jyotish.meta.inputHash]),
    },
  };

  // Garde-fou : un profil non conforme au schéma n'est jamais renvoyé ni stocké.
  const check = profileSchema.safeParse(profile);
  if (!check.success) {
    throw new AstraError('CALCULATION_FAILED', 'Profil non conforme au schéma', {
      issues: check.error.issues.slice(0, 10).map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  return profile;
}
