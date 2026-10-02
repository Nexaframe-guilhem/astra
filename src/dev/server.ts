/**
 * Serveur de développement (Phase 1) : formulaire -> profil complet -> inspection.
 * Usage : npm run dev  puis http://localhost:5173
 * Outil interne : pas d'authentification, à ne jamais exposer publiquement.
 */
import { readFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { buildProfile, buildProfileContext } from '../index.js';
import { collectContentKeys, resolveContent } from '../content/repository.js';
import { AstraError } from '../core/shared/errors.js';
import { REFERENCE_CASES } from '../../tests/fixtures/reference-inputs.js';
import { crossCheck } from './cross-check.js';

const PORT = Number(process.env.PORT ?? 5173);
const html = () => readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const labels = readFileSync(new URL('../content/fr/labels.json', import.meta.url), 'utf8');

function send(res: ServerResponse, status: number, body: unknown, type = 'application/json') {
  res.writeHead(status, { 'content-type': `${type}; charset=utf-8`, 'cache-control': 'no-store' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<any> {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 100_000) throw new AstraError('INVALID_INPUT', 'Requête trop volumineuse');
  }
  return JSON.parse(raw || '{}');
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/') return send(res, 200, html(), 'text/html');
    if (req.method === 'GET' && url.pathname === '/api/presets') return send(res, 200, REFERENCE_CASES);
    if (req.method === 'GET' && url.pathname === '/api/labels') return send(res, 200, labels);
    if (req.method === 'POST' && url.pathname === '/api/profile') {
      const { input, options = {} } = await readJson(req);
      const started = performance.now();
      const profile = buildProfile(input, options);
      const ms = Math.round(performance.now() - started);
      const keys = [...collectContentKeys(profile)].sort();
      const withText = keys.filter((k) => resolveContent(k, { includeDrafts: true }));
      const checks = await crossCheck(profile).catch((e) => [{ section: 'astrology', reference: 'erreur', field: String(e?.message ?? e), ours: '', theirs: '', ok: false }]);
      return send(res, 200, {
        profile,
        context: buildProfileContext(profile),
        contentCoverage: { total: keys.length, withText: withText.length, keys },
        crossCheck: checks,
        timingMs: ms,
      });
    }
    send(res, 404, { error: 'not found' });
  } catch (e) {
    if (e instanceof AstraError) return send(res, 400, { code: e.code, message: e.message, details: e.details });
    // Pas de données de naissance dans les logs (RGPD) : uniquement le message technique.
    console.error('[dev-server]', e instanceof Error ? e.message : e);
    send(res, 500, { code: 'INTERNAL', message: e instanceof Error ? e.message : 'Erreur interne' });
  }
});

server.listen(PORT, () => console.log(`ASTRA dev : http://localhost:${PORT}`));
