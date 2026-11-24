import manifestSource from './creation-content-v1.json';

// This versioned JSON is the demo artifact and is also the seed for TEST.
// Remote gameplay uses the exact immutable manifest returned by the server.
export const CREATION_MANIFEST = JSON.stringify(manifestSource);

export async function creationManifestId(text = CREATION_MANIFEST) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (value) =>
    value.toString(16).padStart(2, '0'),
  ).join('');
}
