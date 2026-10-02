/**
 * Génère la table de Chiron (2060) : positions héliocentriques J2000 (écliptique) tous les 40 jours
 * de 1899 à 2101, par intégration numérique (GravitySimulator d'astronomy-engine, perturbations de
 * Jupiter, Saturne, Uranus et Neptune) à partir d'éléments osculateurs publiés (MPC, époque JD 2456000,5).
 * Usage : npx tsx scripts/build-chiron-table.ts
 */
import * as Astronomy from 'astronomy-engine';
import { writeFileSync } from 'node:fs';

const EPOCH_JD = 2456000.5; // TT
const EL = { i: 6.926651533484328, node: 209.3851130617651, peri: 339.4595737215378, e: 0.3792037887546262, M: 114.8798253094007, q: 8.486494269138399 };
const K = 0.01720209895; // constante de Gauss
const D = Math.PI / 180;

function stateFromElements(): { pos: number[]; vel: number[] } {
  const a = EL.q / (1 - EL.e);
  const n = K / Math.pow(a, 1.5);
  let E = EL.M * D;
  for (let k = 0; k < 50; k++) E -= (E - EL.e * Math.sin(E) - EL.M * D) / (1 - EL.e * Math.cos(E));
  const xp = a * (Math.cos(E) - EL.e), yp = a * Math.sqrt(1 - EL.e ** 2) * Math.sin(E);
  const edot = n / (1 - EL.e * Math.cos(E));
  const vxp = -a * Math.sin(E) * edot, vyp = a * Math.sqrt(1 - EL.e ** 2) * Math.cos(E) * edot;
  const [O, w, i] = [EL.node * D, EL.peri * D, EL.i * D];
  const rot = (x: number, y: number) => [
    (Math.cos(O) * Math.cos(w) - Math.sin(O) * Math.sin(w) * Math.cos(i)) * x + (-Math.cos(O) * Math.sin(w) - Math.sin(O) * Math.cos(w) * Math.cos(i)) * y,
    (Math.sin(O) * Math.cos(w) + Math.cos(O) * Math.sin(w) * Math.cos(i)) * x + (-Math.sin(O) * Math.sin(w) + Math.cos(O) * Math.cos(w) * Math.cos(i)) * y,
    Math.sin(w) * Math.sin(i) * x + Math.cos(w) * Math.sin(i) * y,
  ];
  return { pos: rot(xp, yp), vel: rot(vxp, vyp) };
}

// Écliptique J2000 -> équateur J2000 (EQJ)
const EPS = 23.4392911 * D;
const toEqj = ([x, y, z]: number[]) => [x!, y! * Math.cos(EPS) - z! * Math.sin(EPS), y! * Math.sin(EPS) + z! * Math.cos(EPS)];
const toEcl = (x: number, y: number, z: number) => [x, y * Math.cos(EPS) + z * Math.sin(EPS), -y * Math.sin(EPS) + z * Math.cos(EPS)];

const epoch = Astronomy.MakeTime(EPOCH_JD - 2451545.0).AddDays(0);
// MakeTime attend des jours UT depuis J2000 ; on corrige l'écart TT-UT pour viser l'époque TT.
const t0 = Astronomy.MakeTime(epoch.ut - (epoch.tt - epoch.ut));
const s = stateFromElements();
const [px, py, pz] = toEqj(s.pos), [vx, vy, vz] = toEqj(s.vel);
const start = new Astronomy.StateVector(px!, py!, pz!, vx!, vy!, vz!, t0);

const STEP = 40; // jours (interpolation de Lagrange à 4 points : erreur < 0,00001°)
const FROM = Date.UTC(1899, 0, 1), TO = Date.UTC(2101, 0, 1);
const rows = new Map<number, number[]>();
for (const dir of [-1, 1]) {
  const sim = new Astronomy.GravitySimulator(Astronomy.Body.Sun, t0, [start]);
  // Avance jusqu'à la première date de grille, puis pas fixes avec sous-pas d'un jour.
  let tUt = t0.ut;
  const gridUt = (ms: number) => (ms - Date.UTC(2000, 0, 1, 12)) / 86400000;
  const firstIndex = dir > 0 ? Math.ceil((t0.ut - gridUt(FROM)) / STEP) : Math.floor((t0.ut - gridUt(FROM)) / STEP);
  for (let idx = firstIndex; ; idx += dir) {
    const target = gridUt(FROM) + idx * STEP;
    if (target < gridUt(FROM) || target > gridUt(TO)) break;
    let st: Astronomy.StateVector[] = [];
    while (Math.abs(target - tUt) > 1e-9) {
      tUt = dir > 0 ? Math.min(tUt + 1, target) : Math.max(tUt - 1, target);
      st = sim.Update(Astronomy.MakeTime(tUt));
    }
    if (!st.length) st = sim.Update(Astronomy.MakeTime(tUt));
    const v = st[0]!;
    rows.set(idx, toEcl(v.x, v.y, v.z).map((c) => Math.round(c * 1e5) / 1e5));
  }
}
const idxs = [...rows.keys()].sort((a, b) => a - b);
const table = {
  source: 'Intégration numérique (astronomy-engine GravitySimulator) depuis les éléments osculateurs MPC de (2060) Chiron, époque JD 2456000.5',
  frame: 'héliocentrique, écliptique J2000, UA',
  startUtc: new Date(FROM + idxs[0]! * STEP * 86400000).toISOString(),
  stepDays: STEP,
  xyz: idxs.map((i) => rows.get(i)!),
};
writeFileSync('src/core/ephemeris/chiron-table.json', JSON.stringify(table));
console.log(table.xyz.length, 'lignes', table.startUtc);
