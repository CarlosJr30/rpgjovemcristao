import type { PrototypePolicy } from './prototype-audio-isolation.mjs';
export function prototypeResponse(
  request: Request,
  policy: PrototypePolicy,
  root?: string,
): Promise<Response>;
