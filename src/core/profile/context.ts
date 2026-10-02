/**
 * Vue compacte et structurée du profil, destinée au futur chatbot (Phase 5).
 * Le chatbot ne reçoit jamais le document complet : il reçoit ces sections,
 * sélectionnables selon le besoin de la conversation. Aucune interprétation ici.
 */
import type { Profile } from './schema.js';

export type ContextSection = 'astrology' | 'humanDesign' | 'numerology';

export interface ProfileContext {
  schemaVersion: string;
  astrology?: {
    sun: string; moon: string; ascendant: string; midheaven: string;
    planets: Record<string, { sign: string; house: number; retrograde: boolean }>;
    majorAspects: string[];
    dominantElements: string[];
  };
  humanDesign?: {
    type: string; strategy: string; authority: string; profile: string; definition: string;
    definedCenters: string[]; openCenters: string[]; channels: string[];
    incarnationCross: string; variables: string;
  };
  numerology?: {
    method: string; lifePath: number; expression: number; soulUrge: number; personality: number;
    maturity: number; birthday: number; personalYear: { value: number; referenceDate: string };
    masterNumbers: number[]; karmicDebt: number[]; karmicLessons: number[];
  };
}

export function buildProfileContext(profile: Profile, sections: ContextSection[] = ['astrology', 'humanDesign', 'numerology']): ProfileContext {
  const ctx: ProfileContext = { schemaVersion: profile.schemaVersion };
  if (sections.includes('astrology')) {
    const a = profile.astrology;
    const counts = Object.entries(a.distribution.elements).map(([k, v]) => [k, v.length] as const);
    const max = Math.max(...counts.map(([, n]) => n));
    ctx.astrology = {
      sun: a.bodies.sun!.sign,
      moon: a.bodies.moon!.sign,
      ascendant: a.angles.ascendant.sign,
      midheaven: a.angles.midheaven.sign,
      planets: Object.fromEntries(Object.values(a.bodies).map((b) => [b.id, { sign: b.sign, house: b.house, retrograde: b.retrograde }])),
      majorAspects: a.aspects.filter((x) => x.orb <= 3).map((x) => `${x.a} ${x.type} ${x.b}`),
      dominantElements: counts.filter(([, n]) => n === max).map(([k]) => k),
    };
  }
  if (sections.includes('humanDesign')) {
    const h = profile.humanDesign;
    const centers = Object.entries(h.centers);
    ctx.humanDesign = {
      type: h.type.id,
      strategy: h.strategy.id,
      authority: h.authority.id,
      profile: h.profile.id,
      definition: h.definition.id,
      definedCenters: centers.filter(([, c]) => c.defined).map(([k]) => k),
      openCenters: centers.filter(([, c]) => !c.defined).map(([k]) => k),
      channels: h.channels.map((c) => c.id),
      incarnationCross: h.incarnationCross.id,
      variables: h.variables.notation,
    };
  }
  if (sections.includes('numerology')) {
    const n = profile.numerology;
    ctx.numerology = {
      method: n.method,
      lifePath: n.lifePath.value,
      expression: n.expression.value,
      soulUrge: n.soulUrge.value,
      personality: n.personality.value,
      maturity: n.maturity.value,
      birthday: n.birthday.value,
      personalYear: { value: n.personalCycles.personalYear.value, referenceDate: n.personalCycles.referenceDate },
      masterNumbers: [...new Set(n.masterNumbers.map((m) => m.number))],
      karmicDebt: [...new Set(n.karmicDebt.map((k) => k.number))],
      karmicLessons: n.karmicLessons.map((k) => k.number),
    };
  }
  return ctx;
}
