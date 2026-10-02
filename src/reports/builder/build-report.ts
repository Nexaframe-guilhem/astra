/**
 * Compilation du bilan : Profile + référentiel de contenus -> ReportDocument.
 * Aucune génération de texte : uniquement des libellés, des valeurs et des textes validés.
 */
import { renderAstroWheel } from '../../components/astrology/wheel.js';
import { renderBodyGraph } from '../../components/human-design/bodygraph.js';
import { renderDestinyMatrix } from '../../components/destiny-matrix/matrix.js';
import { renderJyotishChart } from '../../components/jyotish/chart.js';
import { label, resolveContent } from '../../content/repository.js';
import type { Profile } from '../../core/profile/schema.js';

type KarmicPlaced = NonNullable<Profile['karmic']['chiron']>;
import {
  REPORT_VERSION, type BuildReportOptions, type ContentBlock, type ReportBlock, type ReportDocument, type ReportSection,
} from './types.js';

const dms = (p: { dms: { degrees: number; minutes: number }; sign: string }, locale: string) =>
  `${p.dms.degrees}°${String(p.dms.minutes).padStart(2, '0')}′ ${label(p.sign, locale)}`;

export function buildReport(profile: Profile, options: BuildReportOptions = {}): ReportDocument {
  const locale = options.locale ?? 'fr';
  const draft = options.draftMode ?? false;
  const L = (id: string) => label(id, locale);
  const used = new Map<string, { key: string; version: number; status: string }>();

  /** Bloc de contenu pédagogique : texte validé, ou rien (production) / emplacement (relecture). */
  const content = (contentKey: string, title: string): ContentBlock[] => {
    const entry = resolveContent(contentKey, { locale, includeDrafts: draft });
    if (entry) {
      used.set(entry.key, { key: entry.key, version: entry.version, status: entry.status });
      return [{ kind: 'content', contentKey, title: entry.title || title, body: entry.body, status: entry.status === 'validated' ? 'validated' : 'draft', version: entry.version }];
    }
    return draft ? [{ kind: 'content', contentKey, title, body: null, status: 'missing', version: null }] : [];
  };
  /** Avertissements techniques reformulés pour un lecteur non technicien. */
  const notices = (warnings: string[]): ReportBlock[] =>
    warnings
      .filter((w) => !w.startsWith('GATE_BOUNDARY'))
      .map((w) => ({
        kind: 'notice',
        level: 'warning',
        text: w.startsWith('POLAR_LATITUDE')
          ? 'Lieu de naissance au-delà du cercle polaire : le système de Placidus n’y est pas défini, les maisons sont présentées en signes entiers.'
          : w.replace(/^[A-Z_]+: /, ''),
      }));
  const boundaryNotices = (hd: Profile['humanDesign']): ReportBlock[] =>
    (['personality', 'design'] as const).flatMap((side) =>
      hd[side].activations
        .filter((x) => x.gateBoundaryDistance < 0.05)
        .map((x) => ({
          kind: 'notice' as const,
          level: 'warning' as const,
          text: `${L(x.point)} (${L(side)}) est à ${x.gateBoundaryDistance.toFixed(2).replace('.', ',')}° d’une limite de porte : une heure de naissance décalée de quelques minutes pourrait modifier la porte ${x.gate}.`,
        })),
    );

  const { identity: id, birth: b, astrology: a, humanDesign: h, numerology: n, destinyMatrix: dm, jyotish: jy, karmic: k } = profile;
  const fullName = [id.firstName, id.middleNames, id.lastName].filter(Boolean).join(' ');

  const sections: ReportSection[] = [];

  sections.push({
    id: 'identity',
    title: 'Identité',
    subsections: [{
      id: 'birth',
      title: 'Données de naissance',
      blocks: [
        {
          kind: 'facts',
          items: [
            { label: 'Nom', value: fullName + (id.birthLastName ? ` (né·e ${id.birthLastName})` : '') },
            { label: 'Date', value: new Date(`${b.date}T00:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) },
            { label: 'Heure locale', value: b.time },
            { label: 'Lieu', value: [b.place, b.country].filter(Boolean).join(', ') },
            { label: 'Coordonnées', value: `${b.latitude.toFixed(4)}°, ${b.longitude.toFixed(4)}°` },
            { label: 'Fuseau', value: `${b.timezone} (UTC${b.utcOffsetMinutes >= 0 ? '+' : '−'}${formatOffset(Math.abs(b.utcOffsetMinutes))})` },
          ],
        },
        ...notices(b.warnings),
      ],
    }],
  });

  // ---------- Astrologie ----------
  const planetIds = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'northNode', 'southNode'];
  sections.push({
    id: 'astrology',
    title: 'Astrologie',
    subsections: [
      {
        id: 'chart',
        title: 'Thème natal',
        blocks: [
          { kind: 'figure', figure: 'astro-wheel', caption: `Zodiaque tropical, maisons ${L(a.houseSystem)}`, svg: renderAstroWheel(a) },
          {
            kind: 'facts',
            items: [
              { label: L('sun'), value: dms(a.bodies.sun!, locale), contentKey: a.bodies.sun!.contentKeys.placement },
              { label: L('moon'), value: dms(a.bodies.moon!, locale), contentKey: a.bodies.moon!.contentKeys.placement },
              { label: L('ascendant'), value: dms(a.angles.ascendant, locale), contentKey: a.angles.ascendant.contentKeys.placement },
              { label: L('midheaven'), value: dms(a.angles.midheaven, locale), contentKey: a.angles.midheaven.contentKeys.placement },
            ],
          },
          ...notices(a.warnings),
          ...content(a.bodies.sun!.contentKeys.placement!, `${L('sun')} en ${L(a.bodies.sun!.sign)}`),
          ...content(a.bodies.moon!.contentKeys.placement!, `${L('moon')} en ${L(a.bodies.moon!.sign)}`),
          ...content(a.angles.ascendant.contentKeys.placement!, `${L('ascendant')} en ${L(a.angles.ascendant.sign)}`),
        ],
      },
      {
        id: 'planets',
        title: 'Planètes et signes',
        blocks: [
          {
            kind: 'table',
            columns: ['Planète', 'Position', 'Maison', 'Mouvement'],
            rows: planetIds.filter((p) => a.bodies[p]).map((p) => {
              const x = a.bodies[p]!;
              return [L(p), dms(x, locale), String(x.house), x.retrograde && !p.endsWith('Node') ? 'rétrograde' : ''];
            }),
          },
          ...planetIds.slice(2, 10).flatMap((p) => content(a.bodies[p]!.contentKeys.placement!, `${L(p)} en ${L(a.bodies[p]!.sign)}`)),
        ],
      },
      {
        id: 'houses',
        title: 'Maisons',
        blocks: [{
          kind: 'table',
          columns: ['Maison', 'Cuspide', 'Planètes'],
          rows: a.houses.map((c) => [String(c.house), dms(c, locale), planetIds.filter((p) => a.bodies[p]?.house === c.house).map(L).join(', ')]),
        }],
      },
      {
        id: 'aspects',
        title: 'Aspects',
        blocks: [
          {
            kind: 'table',
            columns: ['Aspect', 'Orbe', 'Phase'],
            rows: [...a.aspects].sort((x, y) => x.orb - y.orb).map((x) => [
              `${L(x.a)} ${L(x.type).toLowerCase()} ${L(x.b)}`,
              `${x.orb.toFixed(1)}°`,
              x.applying === null ? '' : x.applying ? 'appliquant' : 'séparant',
            ]),
          },
          ...[...a.aspects].sort((x, y) => x.orb - y.orb).slice(0, 5).flatMap((x) => content(x.contentKeys.pair!, `${L(x.a)} ${L(x.type).toLowerCase()} ${L(x.b)}`)),
        ],
      },
      {
        id: 'distribution',
        title: 'Éléments et modes',
        blocks: [{
          kind: 'table',
          columns: ['', 'Nombre', 'Planètes'],
          rows: [
            ...Object.entries(a.distribution.elements).map(([k, v]) => [L(k === 'earth' ? 'earth_element' : k), String(v.length), v.map(L).join(', ')]),
            ...Object.entries(a.distribution.modalities).map(([k, v]) => [L(k), String(v.length), v.map(L).join(', ')]),
          ],
        }],
      },
    ],
  });

  // ---------- Human Design ----------
  const cross = h.incarnationCross;
  sections.push({
    id: 'humanDesign',
    title: 'Human Design',
    subsections: [
      {
        id: 'overview',
        title: 'Vue d’ensemble',
        blocks: [
          { kind: 'figure', figure: 'bodygraph', caption: 'BodyGraph · noir : Personnalité (conscient) · rouge : Design (inconscient)', svg: renderBodyGraph(h) },
          {
            kind: 'facts',
            items: [
              { label: 'Type', value: L(h.type.id), contentKey: h.type.contentKey },
              { label: 'Stratégie', value: L(h.strategy.id), contentKey: h.strategy.contentKey },
              { label: 'Autorité', value: L(h.authority.id), contentKey: h.authority.contentKey },
              { label: 'Profil', value: h.profile.id, contentKey: h.profile.contentKey },
              { label: 'Définition', value: L(h.definition.id), contentKey: h.definition.contentKey },
              { label: 'Croix d’incarnation', value: `${L(cross.angle)} · ${cross.gates.personalitySun}/${cross.gates.personalityEarth} | ${cross.gates.designSun}/${cross.gates.designEarth}`, contentKey: cross.contentKey },
              { label: 'Variables', value: h.variables.notation },
            ],
          },
          ...boundaryNotices(h),
          ...content(h.type.contentKey, `Type : ${L(h.type.id)}`),
          ...content(h.strategy.contentKey, `Stratégie : ${L(h.strategy.id)}`),
          ...content(h.authority.contentKey, `Autorité : ${L(h.authority.id)}`),
          ...content(h.profile.contentKey, `Profil ${h.profile.id}`),
          ...content(h.definition.contentKey, `Définition : ${L(h.definition.id)}`),
          ...content(cross.contentKey, `Croix d’incarnation`),
        ],
      },
      {
        id: 'centers',
        title: 'Centres',
        blocks: [
          {
            kind: 'table',
            columns: ['Centre', 'État', 'Portes activées'],
            rows: Object.entries(h.centers).map(([k, c]) => [L(k), c.defined ? 'défini' : 'ouvert', c.activeGates.join(', ')]),
          },
          ...Object.values(h.centers).flatMap((c) => content(c.contentKey, c.contentKey.split('.').slice(2).map(L).join(' : '))),
        ],
      },
      {
        id: 'channels',
        title: 'Canaux et portes',
        blocks: [
          {
            kind: 'table',
            columns: ['Canal', 'Centres'],
            rows: h.channels.map((c) => [c.id, `${L(c.centers[0])} – ${L(c.centers[1])}`]),
          },
          ...h.channels.flatMap((c) => content(c.contentKey, `Canal ${c.id}`)),
          {
            kind: 'table',
            caption: 'Portes activées',
            columns: ['Porte', 'Centre', 'Activations', 'Canal'],
            rows: h.gates.map((g) => [
              String(g.gate),
              L(g.center),
              g.activatedBy.map((x) => `${L(x.point)} ${x.side === 'design' ? 'D' : 'P'} (ligne ${x.line})`).join(', '),
              g.inChannel ? 'oui' : '',
            ]),
          },
        ],
      },
      {
        id: 'activations',
        title: 'Personnalité et Design',
        blocks: (['personality', 'design'] as const).map((side) => ({
          kind: 'table' as const,
          caption: `${L(side)} · ${new Date(h[side].utc).toISOString().slice(0, 16).replace('T', ' ')} UTC`,
          columns: ['Point', 'Porte.Ligne', 'Couleur', 'Ton', 'Base'],
          rows: h[side].activations.map((x) => [L(x.point), `${x.gate}.${x.line}`, String(x.color), String(x.tone), String(x.base)]),
        })),
      },
    ],
  });

  // ---------- Numérologie ----------
  const core: Array<[string, { value: number; chain: number[]; contentKey: string }]> = [
    ['lifePath', n.lifePath], ['expression', n.expression], ['soulUrge', n.soulUrge],
    ['personality', n.personality], ['maturity', n.maturity], ['birthday', n.birthday],
  ];
  const cycleRows = (name: string, list: typeof n.cycles.pinnacles) =>
    list.map((c) => [`${name} ${c.index}`, String(c.value), c.toAge === null ? `dès ${c.fromAge} ans` : `${c.fromAge} à ${c.toAge} ans`]);
  sections.push({
    id: 'numerology',
    title: 'Numérologie',
    subsections: [
      {
        id: 'core',
        title: 'Nombres principaux',
        blocks: [
          {
            kind: 'table',
            columns: ['Nombre', 'Valeur', 'Calcul'],
            rows: core.map(([k, v]) => [L(k === 'personality' ? 'personalityNumber' : k), String(v.value), v.chain.join(' → ')]),
          },
          { kind: 'facts', items: [
            { label: 'Nom utilisé', value: n.normalizedName.parts.join(' ') },
            { label: 'Nombres maîtres', value: [...new Set(n.masterNumbers.map((m) => m.number))].join(', ') || 'aucun' },
            { label: 'Dettes karmiques', value: n.karmicDebt.map((k) => `${k.number} (${L(k.source === 'personality' ? 'personalityNumber' : k.source)})`).join(', ') || 'aucune' },
            { label: 'Leçons karmiques', value: n.karmicLessons.map((k) => k.number).join(', ') || 'aucune' },
          ] },
          ...core.flatMap(([k, v]) => content(v.contentKey, `${L(k === 'personality' ? 'personalityNumber' : k)} ${v.value}`)),
          ...n.karmicDebt.flatMap((k) => content(k.contentKey, `Dette karmique ${k.number}`)),
        ],
      },
      {
        id: 'cycles',
        title: 'Cycles',
        blocks: [
          {
            kind: 'facts',
            items: [
              { label: `Année personnelle (${n.personalCycles.referenceDate.slice(0, 4)})`, value: String(n.personalCycles.personalYear.value), contentKey: n.personalCycles.personalYear.contentKey },
              { label: 'Mois personnel', value: String(n.personalCycles.personalMonth.value) },
              { label: 'Jour personnel', value: String(n.personalCycles.personalDay.value) },
            ],
          },
          { kind: 'notice', level: 'info', text: `Cycles personnels calculés au ${new Date(`${n.personalCycles.referenceDate}T00:00:00Z`).toLocaleDateString(locale, { timeZone: 'UTC' })}.` },
          {
            kind: 'table',
            columns: ['Cycle', 'Valeur', 'Période'],
            rows: [...cycleRows('Cycle de vie', n.cycles.lifeCycles), ...cycleRows('Réalisation', n.cycles.pinnacles), ...cycleRows('Défi', n.cycles.challenges)],
          },
          ...content(n.personalCycles.personalYear.contentKey, `Année personnelle ${n.personalCycles.personalYear.value}`),
        ],
      },
      {
        id: 'grid',
        title: 'Grille d’inclusion',
        blocks: [{ kind: 'table', columns: Object.keys(n.inclusionGrid), rows: [Object.values(n.inclusionGrid).map(String)] }],
      },
    ],
  });

  // ---------- Matrice du destin ----------
  const arcanaName = (v: number) => `${v} · ${L(`arcana${v}`)}`;
  const main = dm.positions.filter((p) => p.arcanaContentKey);
  const pos = (pid: string) => dm.positions.find((p) => p.id === pid)!;
  sections.push({
    id: 'destinyMatrix',
    title: 'Matrice du destin',
    subsections: [
      {
        id: 'chart',
        title: 'Schéma',
        blocks: [
          { kind: 'figure', figure: 'destiny-matrix', caption: `Matrice du destin, née de la date du ${new Date(`${dm.birthDate}T00:00:00Z`).toLocaleDateString(locale, { timeZone: 'UTC' })}`, svg: renderDestinyMatrix(dm, { width: 420 }) },
          {
            kind: 'table',
            columns: ['Position', 'Arcane', 'Points'],
            rows: [
              ...main.map((p) => [L(`matrix.${p.id}`), arcanaName(p.values[0]!), p.points.join(', ')]),
              ...(['karmicTail', 'paternalLine', 'maternalLine'] as const).map((k) => [L(`matrix.${k}`), pos(k).values.join(' – '), pos(k).points.join(', ')]),
            ],
          },
        ],
      },
      {
        id: 'positions',
        title: 'Lecture par position',
        blocks: [
          ...main.flatMap((p) => [
            ...content(p.contentKey, L(`matrix.${p.id}`)),
            ...content(p.arcanaContentKey!, `${L(`matrix.${p.id}`)} : ${arcanaName(p.values[0]!)}`),
          ]),
          ...content(pos('karmicTail').contentKey, `${L('matrix.karmicTail')} ${pos('karmicTail').values.join('-')}`),
        ],
      },
      {
        id: 'arcana',
        title: 'Les arcanes de votre matrice',
        blocks: [...new Set(main.map((p) => p.values[0]!))].sort((x, y) => x - y).flatMap((v) => content(`destinyMatrix.arcana.${v}`, arcanaName(v))),
      },
    ],
  });

  // ---------- Jyotish ----------
  const nakName = (x: { id: string; pada: number }) => `${L(`nakshatra.${x.id}`)} (pada ${x.pada})`;
  const frDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const moonJ = jy.grahas.find((g) => g.id === 'moon')!;
  const currentMd = jy.dashas.mahadashas.find((m) => m.lord === jy.dashas.current.mahadasha && m.start <= jy.dashas.current.referenceDate && jy.dashas.current.referenceDate < m.end);
  sections.push({
    id: 'jyotish',
    title: 'Astrologie védique (Jyotish)',
    subsections: [
      {
        id: 'chart',
        title: 'Carte natale sidérale',
        blocks: [
          { kind: 'figure', figure: 'jyotish-chart', caption: `Zodiaque sidéral (ayanamsa Lahiri ${jy.ayanamsa.value.toFixed(2).replace('.', ',')}°), maisons en signes entiers, style nord-indien. Les nombres indiquent les signes (1 = Bélier).`, svg: renderJyotishChart(jy, { width: 400 }) },
          {
            kind: 'facts',
            items: [
              { label: 'Lagna (ascendant)', value: dms(jy.lagna, locale), contentKey: jy.lagna.contentKey },
              { label: 'Lune', value: `${dms(moonJ, locale)}, ${nakName(moonJ.nakshatra)}`, contentKey: moonJ.contentKeys.nakshatra },
              { label: 'Nakshatra du lagna', value: nakName(jy.lagna.nakshatra) },
              { label: 'Dasha en cours', value: jy.dashas.current.mahadasha ? `${L(jy.dashas.current.mahadasha)}${jy.dashas.current.antardasha ? ` / ${L(jy.dashas.current.antardasha)}` : ''}` : '—' },
            ],
          },
          ...notices(jy.warnings),
          ...content(jy.lagna.contentKey, `Lagna en ${L(jy.lagna.sign)}`),
          ...content(moonJ.contentKeys.nakshatra, `Lune en ${L(`nakshatra.${moonJ.nakshatra.id}`)}`),
        ],
      },
      {
        id: 'grahas',
        title: 'Grahas, signes et maisons',
        blocks: [
          {
            kind: 'table',
            columns: ['Graha', 'Position sidérale', 'Maison', 'Nakshatra', 'Navamsa', 'État'],
            rows: jy.grahas.map((g) => [
              L(g.id), dms(g, locale), String(g.house), nakName(g.nakshatra), L(g.navamsaSign),
              [g.dignity === 'neutral' ? '' : L(g.dignity), g.retrograde && g.id !== 'rahu' && g.id !== 'ketu' ? 'rétrograde' : ''].filter(Boolean).join(', '),
            ]),
          },
          ...jy.grahas.flatMap((g) => [
            ...content(g.contentKeys.sign, `${L(g.id)} en ${L(g.sign)}`),
            ...content(g.contentKeys.house, `${L(g.id)} en maison ${g.house}`),
          ]),
        ],
      },
      {
        id: 'dashas',
        title: 'Périodes de vie (Vimshottari dasha)',
        blocks: [
          {
            kind: 'table',
            columns: ['Période (mahadasha)', 'Début', 'Fin', 'Durée'],
            rows: jy.dashas.mahadashas.map((m) => [L(m.lord), frDate(m.start), frDate(m.end), `${m.years.toFixed(1).replace('.', ',')} ans`]),
          },
          ...(currentMd ? [
            ...content(currentMd.contentKey, `Période de ${L(currentMd.lord)}`),
            {
              kind: 'table' as const,
              columns: [`Sous-périodes de ${L(currentMd.lord)} (antardashas)`, 'Début', 'Fin'],
              rows: currentMd.antardashas.map((a) => [L(a.lord), frDate(a.start), frDate(a.end)]),
            },
          ] : []),
        ],
      },
    ],
  });

  // ---------- Astrologie karmique ----------
  const kRow = (name: string, x: { dms: { degrees: number; minutes: number }; sign: string; house: number; retrograde: boolean } | null, showRetro = true) =>
    x ? [name, dms(x, locale), String(x.house), showRetro && x.retrograde ? 'rétrograde' : ''] : [name, 'non calculé', '', ''];
  const kPoint = (key: 'nodes' | 'saturn' | 'chiron' | 'lilith', name: string, x: KarmicPlaced | null): ReportBlock[] => x ? [
    ...content(x.contentKeys.sign, `${name} en ${L(x.sign)}`),
    ...content(x.contentKeys.house, `${name} en maison ${x.house}`),
  ] : [];
  sections.push({
    id: 'karmic',
    title: 'Astrologie karmique',
    subsections: [
      {
        id: 'points',
        title: 'Points karmiques',
        blocks: [
          ...content(k.contentKey, 'L’astrologie karmique'),
          {
            kind: 'table',
            columns: ['Point', 'Position', 'Maison', 'Mouvement'],
            rows: [
              kRow(L('northNode'), k.nodes.north, false), kRow(L('southNode'), k.nodes.south, false), kRow(L('saturn'), k.saturn),
              kRow(L('chiron'), k.chiron), kRow(L('lilith'), k.lilith, false),
            ],
          },
          ...notices(k.warnings),
        ],
      },
      { id: 'nodes', title: 'L’axe des nœuds lunaires', blocks: kPoint('nodes', 'Nœud Nord', k.nodes.north) },
      { id: 'saturn', title: 'Saturne, maître du temps', blocks: kPoint('saturn', 'Saturne', k.saturn) },
      ...(k.chiron ? [{ id: 'chiron', title: 'Chiron, la blessure qui enseigne', blocks: kPoint('chiron', 'Chiron', k.chiron) }] : []),
      { id: 'lilith', title: 'Lilith, la Lune noire', blocks: kPoint('lilith', 'Lilith', k.lilith) },
      {
        id: 'retrogrades',
        title: 'Planètes rétrogrades',
        blocks: k.retrogrades.length
          ? k.retrogrades.flatMap((r) => content(r.contentKey, `${L(r.id)} rétrograde`))
          : [{ kind: 'notice', level: 'info', text: 'Aucune planète n’était rétrograde à la naissance.' }],
      },
      ...(k.house12.length ? [{ id: 'house12', title: 'Maison 12', blocks: k.house12.flatMap((b) => content(b.contentKey, `${L(b.id)} en maison 12`)) }] : []),
    ],
  });

  // ---------- Méthodologie ----------
  sections.push({
    id: 'methodology',
    title: 'Méthode de calcul',
    subsections: [{
      id: 'engines',
      title: 'Moteurs et conventions',
      blocks: [
        {
          kind: 'table',
          columns: ['Domaine', 'Moteur', 'Conventions'],
          rows: [
            ['Astrologie', `${a.meta.engine} ${a.meta.engineVersion}`, `zodiaque tropical, maisons ${L(a.houseSystem)}, nœud ${a.meta.settings.nodeType === 'true' ? 'vrai' : 'moyen'}`],
            ['Human Design', `${h.meta.engine} ${h.meta.engineVersion}`, `Design à ${h.design.solarArcDegrees}° d’arc solaire, nœud ${h.meta.settings.nodeType === 'true' ? 'vrai' : 'moyen'}`],
            ['Numérologie', `${n.meta.engine} ${n.meta.engineVersion}`, `convention ${String(n.meta.settings.convention)}${n.meta.settings.customized ? ' (personnalisée)' : ''}, méthode ${L(n.method)}`],
            ['Jyotish', `${jy.meta.engine} ${jy.meta.engineVersion}`, `zodiaque sidéral, ayanamsa Lahiri, maisons en signes entiers, Rahu/Ketu nœud ${jy.meta.settings.nodeType === 'true' ? 'vrai' : 'moyen'}, Vimshottari (année de ${String(jy.meta.settings.dashaYearDays).replace('.', ',')} jours)`],
            ['Astrologie karmique', `${k.meta.engine} ${k.meta.engineVersion}`, 'thème tropical ci-dessus, Lilith moyenne (apogée lunaire moyen), Chiron par intégration numérique (1900-2100)'],
            ['Matrice du destin', `${dm.meta.engine} ${dm.meta.engineVersion}`, `convention ${String(dm.meta.settings.convention)}, 22 arcanes, réduction par somme des chiffres`],
          ],
        },
        { kind: 'notice', level: 'info', text: 'Ce bilan compile des résultats calculés de manière déterministe et des textes validés par l’école. Aucune intelligence artificielle n’intervient dans sa production.' },
      ],
    }],
  });

  return {
    reportVersion: REPORT_VERSION,
    locale,
    generatedAt: (options.now ?? new Date()).toISOString(),
    title: 'Bilan personnel',
    subject: fullName,
    profile: { schemaVersion: profile.schemaVersion, inputHash: profile.meta.inputHash },
    contentUsed: [...used.values()].sort((x, y) => x.key.localeCompare(y.key)),
    sections,
  };
}

function formatOffset(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes - h * 60);
  return `${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
}
