/** API publique du module ASTRA. Le reste de l'application n'importe que d'ici. */
export { buildProfile, type BuildProfileOptions } from './core/profile/build-profile.js';
export { profileSchema, type Profile } from './core/profile/schema.js';
export { buildProfileContext, type ProfileContext, type ContextSection } from './core/profile/context.js';
export { calculateAstrology, type AstrologyResult, type AstrologySettings } from './core/astrology/index.js';
export { calculateHumanDesign, type HumanDesignResult, type HumanDesignSettings } from './core/human-design/index.js';
export { calculateNumerology, type NumerologyResult, type NumerologySettings } from './core/numerology/index.js';
export { calculateJyotish, type JyotishResult } from './core/jyotish/index.js';
export { calculateDestinyMatrix, type DestinyMatrixResult } from './core/destiny-matrix/index.js';
export { normalizeBirthData } from './core/birth-data/normalize.js';
export { type BirthInput, type BirthData } from './core/birth-data/types.js';
export { AstraError } from './core/shared/errors.js';
export { SCHEMA_VERSION } from './core/shared/meta.js';
export { resolveContent, type ContentEntry } from './content/repository.js';
export { buildReport, renderReportHtml, type ReportDocument } from './reports/index.js';
export { renderAstroWheel } from './components/astrology/wheel.js';
export { renderBodyGraph } from './components/human-design/bodygraph.js';
