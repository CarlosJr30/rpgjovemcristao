export type PrototypeAudit = {
  pass: boolean;
  music: Partial<Record<string, { src: string; license: string }>>;
  effects: Partial<Record<string, { src: string; license: string }>>;
  results: {
    file: string;
    status: 'APPROVED_FOR_PROTOTYPE' | 'MISSING' | 'REJECTED';
    reason?: string;
    sha256?: string;
    duration?: number;
  }[];
};
export function auditArenaPrototype(
  root: string,
  approvals: unknown,
  probe?: (file: string) => {
    format: { format_name: string; duration: number };
    streams: {
      codec_type: string;
      codec_name: string;
      sample_rate: number;
      channels: number;
      disposition: { attached_pic: number };
    }[];
  },
): Promise<PrototypeAudit>;
