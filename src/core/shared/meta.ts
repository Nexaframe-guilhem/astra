import { createHash } from 'node:crypto';
import { EPHEMERIS_VERSION } from '../ephemeris/index.js';
import { z } from 'zod';

/** Version du schéma JSON normalisé. Majeure = rupture, mineure = ajout rétro-compatible. */
export const SCHEMA_VERSION = '1.0' as const;

export const engineMetaSchema = z.object({
  engine: z.string(),
  engineVersion: z.string(),
  schemaVersion: z.string(),
  calculatedAt: z.string().datetime(),
  /** Versions exactes des bibliothèques et données utilisées (ex. astronomy-engine, tzdata). */
  dependencies: z.record(z.string(), z.string()),
  /** Paramètres effectifs du calcul (système de maisons, orbes, conventions…). */
  settings: z.record(z.string(), z.unknown()),
  /** Empreinte SHA-256 des entrées normalisées + paramètres : même hash => même résultat attendu. */
  inputHash: z.string(),
});
export type EngineMeta = z.infer<typeof engineMetaSchema>;

/** JSON canonique (clés triées) pour un hash stable. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function sha256(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

export interface MetaArgs {
  engine: string;
  engineVersion: string;
  dependencies: Record<string, string>;
  settings: Record<string, unknown>;
  hashedInput: unknown;
  now?: Date;
}

export function buildMeta(args: MetaArgs): EngineMeta {
  return {
    engine: args.engine,
    engineVersion: args.engineVersion,
    schemaVersion: SCHEMA_VERSION,
    calculatedAt: (args.now ?? new Date()).toISOString(),
    dependencies: args.dependencies,
    settings: args.settings,
    inputHash: sha256({ input: args.hashedInput, settings: args.settings, engineVersion: args.engineVersion }),
  };
}

/** Versions des dépendances runtime, lues une seule fois. */
export const RUNTIME_VERSIONS = {
  'astronomy-engine': EPHEMERIS_VERSION,
  tzdata: process.versions.tz ?? 'unknown',
  icu: process.versions.icu ?? 'unknown',
} as const;
