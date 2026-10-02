/**
 * Référentiel de contenus pédagogiques validés.
 * Le profil ne stocke que des valeurs + des `contentKey` ; les textes vivent ici
 * (puis dans une table Supabase `content_entries` en Phase 3), modifiables par l'école
 * sans recalculer aucun profil. Aucune génération de texte.
 */
import labelsFr from './fr/labels.json' with { type: 'json' };
import textsFr from './fr/texts.json' with { type: 'json' };

export type ContentStatus = 'draft' | 'validated' | 'archived';

export interface ContentEntry {
  key: string;
  locale: string;
  title: string;
  body: string;
  status: ContentStatus;
  version: number;
  /** Provenance du texte, par ex. « pré-rédaction automatique (composée) » ; absent pour un texte écrit par l'école. */
  origin?: string;
}

type RawEntry = Omit<ContentEntry, 'key' | 'locale'>;
const TEXTS: Record<string, Record<string, RawEntry>> = { fr: textsFr as Record<string, RawEntry> };
const LABELS: Record<string, Record<string, string>> = { fr: labelsFr as Record<string, string> };

export interface ResolveOptions {
  locale?: string;
  /** En production, seuls les contenus validés sont servis. */
  includeDrafts?: boolean;
}

export function resolveContent(key: string, options: ResolveOptions = {}): ContentEntry | null {
  const locale = options.locale ?? 'fr';
  const entry = TEXTS[locale]?.[key];
  if (!entry) return null;
  if (entry.status !== 'validated' && !options.includeDrafts) return null;
  return { key, locale, ...entry };
}

/** Libellé d'affichage d'un identifiant technique (ex. "gemini" -> "Gémeaux"). Ce n'est pas une interprétation. */
export function label(id: string, locale = 'fr'): string {
  return LABELS[locale]?.[id] ?? id;
}

/** Toutes les clés de contenu référencées par un objet (profil complet ou section). */
export function collectContentKeys(value: unknown, acc = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => collectContentKeys(v, acc));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (k === 'contentKey' && typeof v === 'string') acc.add(v);
      else if (k === 'contentKeys' && v && typeof v === 'object') Object.values(v).forEach((x) => typeof x === 'string' && acc.add(x));
      else collectContentKeys(v, acc);
    }
  }
  return acc;
}
