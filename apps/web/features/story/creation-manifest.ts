import manifestSource from './creation-content-v1.json';

// This versioned presentation is used by the local demonstration.
// Remote gameplay uses the exact public projection returned by the server.
export const CREATION_MANIFEST = JSON.stringify(manifestSource);

export async function creationManifestId(text = CREATION_MANIFEST) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (value) =>
    value.toString(16).padStart(2, '0'),
  ).join('');
}
