export type PackAudit = {
  music: Partial<
    Record<string, { src: string; fallbackSrc?: string; license: string }>
  >;
  effects: Partial<
    Record<string, { src: string; fallbackSrc?: string; license: string }>
  >;
  visual: Partial<
    Record<string, { src: string; mobileSrc?: string; license: string }>
  >;
  results: {
    file: string;
    status: 'MISSING' | 'VALIDATED' | 'REJECTED';
    reason?: string;
    sha256?: string;
  }[];
  pass: boolean;
};
export function auditPack(
  root: string,
  manifest: unknown,
  approvals: unknown,
  probe?: (file: string) => {
    sampleRate: number;
    channels: number;
    duration: number;
  },
): Promise<PackAudit>;
