/** Garde-fou : la version déclarée dans la méta des résultats = version réellement installée. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EPHEMERIS_VERSION } from '../src/core/ephemeris/index.js';
import { RUNTIME_VERSIONS } from '../src/core/shared/meta.js';

describe('versions des dépendances', () => {
  it('astronomy-engine', () => {
    const pkg = JSON.parse(readFileSync(new URL('../node_modules/astronomy-engine/package.json', import.meta.url), 'utf8'));
    expect(EPHEMERIS_VERSION).toBe(pkg.version);
    expect(RUNTIME_VERSIONS['astronomy-engine']).toBe(pkg.version);
  });
  it('tzdata embarqué dans Node est renseigné', () => {
    expect(RUNTIME_VERSIONS.tzdata).toMatch(/^\d{4}[a-z]$/);
  });
});
