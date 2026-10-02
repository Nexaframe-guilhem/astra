/**
 * Conversion heure locale -> UTC avec la base IANA embarquée dans Node (ICU).
 * Gère l'historique (changements d'offset, heures d'été passées) et refuse
 * explicitement les heures inexistantes ou ambiguës au lieu de deviner.
 */
import { AstraError } from '../shared/errors.js';

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatterCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      era: 'short',
    });
    formatterCache.set(timeZone, f);
  }
  return f;
}

export function isValidTimezone(timeZone: string): boolean {
  try {
    formatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** Décalage (minutes) du fuseau à un instant UTC donné. */
export function offsetMinutesAt(timeZone: string, utcMs: number): number {
  const parts = Object.fromEntries(formatter(timeZone).formatToParts(new Date(utcMs)).map((p) => [p.type, p.value]));
  let year = Number(parts.year);
  if (parts.era === 'BC' || parts.era === 'B') year = 1 - year;
  const asUtc = Date.UTC(year, Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
  // Les offsets historiques (LMT) peuvent contenir des secondes : on travaille à la seconde près.
  const wholeSecondUtc = Math.floor(utcMs / 1000) * 1000;
  return (asUtc - wholeSecondUtc) / 60000;
}

export interface LocalToUtcResult {
  utcMs: number;
  offsetMinutes: number;
}

/**
 * Convertit une heure civile locale en instant UTC.
 * - Heure inexistante (saut de printemps) : erreur NONEXISTENT_LOCAL_TIME.
 * - Heure ambiguë (retour d'automne) : erreur AMBIGUOUS_LOCAL_TIME sauf si `ambiguity` est fourni.
 */
export function localToUtc(
  local: { year: number; month: number; day: number; hour: number; minute: number; second?: number },
  timeZone: string,
  ambiguity?: 'earlier' | 'later',
): LocalToUtcResult {
  if (!isValidTimezone(timeZone)) {
    throw new AstraError('UNKNOWN_TIMEZONE', `Fuseau horaire inconnu : ${timeZone}`, { timeZone });
  }
  const naive = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second ?? 0);
  // Les candidats possibles : offsets en vigueur autour de l'instant (±36 h couvre tous les cas réels).
  const offsets = new Set<number>();
  for (const probeHours of [-36, -12, 0, 12, 36]) {
    offsets.add(offsetMinutesAt(timeZone, naive + probeHours * 3600_000));
  }
  const matches: LocalToUtcResult[] = [];
  for (const offset of offsets) {
    const utcMs = naive - offset * 60000;
    if (offsetMinutesAt(timeZone, utcMs) === offset) matches.push({ utcMs, offsetMinutes: offset });
  }
  matches.sort((a, b) => a.utcMs - b.utcMs);

  if (matches.length === 0) {
    throw new AstraError(
      'NONEXISTENT_LOCAL_TIME',
      "Cette heure locale n'a pas existé (passage à l'heure d'été). Vérifiez l'heure de naissance.",
      { timeZone },
    );
  }
  if (matches.length > 1) {
    if (!ambiguity) {
      throw new AstraError(
        'AMBIGUOUS_LOCAL_TIME',
        "Cette heure locale a existé deux fois (retour à l'heure d'hiver). Précisez 'earlier' ou 'later'.",
        { timeZone, candidatesOffsetMinutes: matches.map((m) => m.offsetMinutes) },
      );
    }
    return ambiguity === 'earlier' ? matches[0]! : matches[matches.length - 1]!;
  }
  return matches[0]!;
}

/** Jour julien UT d'un instant (ms depuis l'époque Unix). */
export function julianDayFromUtcMs(utcMs: number): number {
  return utcMs / 86400000 + 2440587.5;
}
