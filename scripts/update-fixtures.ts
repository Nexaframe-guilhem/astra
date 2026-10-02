/**
 * Régénère les profils de référence figés. À lancer UNIQUEMENT après avoir vérifié
 * qu'un changement de résultat est voulu (nouvelle convention, correction validée).
 * Le diff git des fichiers golden sert alors de revue.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { buildProfile } from '../src/index.js';
import { FIXED_NOW, FIXED_REFERENCE_DATE, REFERENCE_CASES } from '../tests/fixtures/reference-inputs.js';

const dir = new URL('../tests/fixtures/golden/', import.meta.url);
mkdirSync(dir, { recursive: true });
for (const c of REFERENCE_CASES) {
  const profile = buildProfile(c.input, { now: FIXED_NOW, referenceDate: FIXED_REFERENCE_DATE });
  writeFileSync(new URL(`${c.id}.json`, dir), `${JSON.stringify(profile, null, 2)}\n`);
  console.log(`✓ ${c.id}`);
}
