import { TEXT_VS } from '../shared/svg.js';

const g = (c: string) => c + TEXT_VS;

export const SIGN_GLYPHS: Record<string, string> = {
  aries: g('♈'), taurus: g('♉'), gemini: g('♊'), cancer: g('♋'), leo: g('♌'), virgo: g('♍'),
  libra: g('♎'), scorpio: g('♏'), sagittarius: g('♐'), capricorn: g('♑'), aquarius: g('♒'), pisces: g('♓'),
};

export const BODY_GLYPHS: Record<string, string> = {
  sun: g('☉'), moon: g('☽'), mercury: g('☿'), venus: g('♀'), mars: g('♂'), jupiter: g('♃'),
  saturn: g('♄'), uranus: g('♅'), neptune: g('♆'), pluto: g('♇'), northNode: g('☊'), southNode: g('☋'),
};
