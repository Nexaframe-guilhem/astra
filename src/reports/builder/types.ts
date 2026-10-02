/**
 * Document de bilan : structure intermédiaire indépendante du rendu (HTML, PDF, Webflow, e-mail).
 * Il ne contient que des valeurs calculées, des libellés et des textes issus du référentiel validé.
 */
export const REPORT_VERSION = '1.0';

export interface ContentBlock {
  kind: 'content';
  contentKey: string;
  title: string;
  /** Texte validé par l'école, ou null si absent (en mode brouillon, un emplacement est affiché). */
  body: string | null;
  status: 'validated' | 'draft' | 'missing';
  version: number | null;
}

export interface FactsBlock {
  kind: 'facts';
  items: Array<{ label: string; value: string; contentKey?: string }>;
}

export interface TableBlock {
  kind: 'table';
  caption?: string;
  columns: string[];
  rows: string[][];
}

export interface FigureBlock {
  kind: 'figure';
  figure: 'astro-wheel' | 'bodygraph' | 'destiny-matrix';
  caption: string;
  /** SVG autonome, généré côté serveur. */
  svg: string;
}

export interface NoticeBlock {
  kind: 'notice';
  level: 'info' | 'warning';
  text: string;
}

export type ReportBlock = ContentBlock | FactsBlock | TableBlock | FigureBlock | NoticeBlock;

export interface ReportSection {
  id: 'identity' | 'astrology' | 'humanDesign' | 'numerology' | 'destinyMatrix' | 'methodology';
  title: string;
  subsections: Array<{ id: string; title: string; blocks: ReportBlock[] }>;
}

export interface ReportDocument {
  reportVersion: string;
  locale: string;
  generatedAt: string;
  title: string;
  subject: string;
  /** Lien vers le profil source : permet de régénérer le bilan à l'identique. */
  profile: { schemaVersion: string; inputHash: string };
  /** Versions exactes des textes utilisés (traçabilité pédagogique). */
  contentUsed: Array<{ key: string; version: number; status: string }>;
  sections: ReportSection[];
}

export interface BuildReportOptions {
  locale?: string;
  /** Afficher les textes en brouillon et les emplacements manquants (relecture école). */
  draftMode?: boolean;
  now?: Date;
}
