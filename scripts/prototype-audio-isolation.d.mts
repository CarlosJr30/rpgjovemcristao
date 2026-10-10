export const REPOSITORY_ROOT: string;
export type PrototypeItem = {
  receiptKey: string;
  originalPath: string;
  sourcePath: string;
  sha256: string;
};
export type PrototypePolicy = {
  version: number;
  sourceRoot: string;
  items: PrototypeItem[];
  approvals: { files: Record<string, Record<string, unknown>> };
};
export function readPrototypePolicy(root?: string): Promise<PrototypePolicy>;
export function assertPrototypeSources(root?: string): Promise<PrototypePolicy>;
export function readPrototypeSource(
  root: string,
  policy: PrototypePolicy,
  item: PrototypeItem,
): Promise<Uint8Array>;
export function assertProductionPublic(
  root?: string,
): Promise<{ scanned: number; findings: object[]; pass: boolean }>;
export function assertProductionArtifact(
  root?: string,
): Promise<{
  scanned: number;
  findings: object[];
  pass: boolean;
  sourceHashesPreserved: number;
  dist: string;
}>;
