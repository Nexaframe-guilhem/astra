/** Exporte le cahier de rédaction des contenus (CSV pour tableur + JSON) dans content-catalog/. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { buildContentCatalog } from '../src/content/catalog.js';
import { resolveContent } from '../src/content/repository.js';

const rows = buildContentCatalog('fr');
const csvCell = (s: string) => (/[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
const header = ['key', 'domain', 'priority', 'title', 'status', 'origin', 'body'];
const lines = rows.map((r) => {
  const c = resolveContent(r.key, { includeDrafts: true });
  return [r.key, r.domain, String(r.priority), r.title, c?.status ?? 'missing', c?.origin ?? '', c?.body ?? ''].map(csvCell).join(';');
});
mkdirSync('content-catalog', { recursive: true });
writeFileSync('content-catalog/fr.csv', `﻿${header.join(';')}\n${lines.join('\n')}\n`);
writeFileSync('content-catalog/fr.json', `${JSON.stringify(rows, null, 1)}\n`);
const byPriority = [1, 2, 3].map((p) => `P${p} : ${rows.filter((r) => r.priority === p).length}`).join(' · ');
console.log(`${rows.length} clés (${byPriority}) -> content-catalog/fr.csv`);
