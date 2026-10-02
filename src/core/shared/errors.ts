/**
 * Erreur métier typée. `code` est stable et destiné à l'interface / aux logs ;
 * `details` ne doit jamais contenir de donnée personnelle brute (RGPD).
 */
export class AstraError extends Error {
  constructor(
    public readonly code: AstraErrorCode,
    message: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'AstraError';
  }
}

export type AstraErrorCode =
  | 'INVALID_INPUT'
  | 'UNKNOWN_TIMEZONE'
  | 'NONEXISTENT_LOCAL_TIME'
  | 'AMBIGUOUS_LOCAL_TIME'
  | 'OUT_OF_RANGE'
  | 'CALCULATION_FAILED';
