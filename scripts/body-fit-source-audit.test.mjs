import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mapSource, validatePngChunks } from './body-fit-source-audit.mjs';

const targets = [
  { filename: 'armor_traveler_uncommon_female_v2.png' },
  { filename: 'armor_traveler_rare_male_v2.png' },
];
const source = {
  file: 'armadura_paladina_verde_e_dourada.png',
  sha256: 'actual-hash',
};

test('depicted slot and paladina name do not imply target gender or rarity', () => {
  assert.equal(
    mapSource(
      source,
      [
        {
          filename: source.file,
          sha256: source.sha256,
          status: 'SOURCE_VISUAL_APPROVED',
        },
      ],
      targets,
    ).status,
    'UNMAPPED_SOURCE_ART',
  );
});
test('explicit target requires matching source filename and actual hash', () => {
  const entry = {
    filename: source.file,
    sha256: source.sha256,
    targetFilename: targets[0].filename,
  };
  assert.equal(mapSource(source, [entry], targets).target, targets[0].filename);
  assert.equal(
    mapSource(source, [{ ...entry, sha256: 'wrong' }], targets).status,
    'UNMAPPED_SOURCE_ART',
  );
});
test('unknown targets and ambiguous targets stay unmapped', () => {
  const entry = {
    filename: source.file,
    sha256: source.sha256,
    targetFilename: 'not-a-target.png',
  };
  assert.equal(
    mapSource(source, [entry], targets).status,
    'UNMAPPED_SOURCE_ART',
  );
  assert.equal(
    mapSource(
      source,
      targets.map((target) => ({ ...entry, targetFilename: target.filename })),
      targets,
    ).status,
    'UNMAPPED_SOURCE_ART',
  );
});
test('exact target filename maps without fuzzy renaming', () => {
  assert.equal(
    mapSource({ ...source, file: targets[0].filename }, [], targets).target,
    targets[0].filename,
  );
});
test('delivered PNG passes strict CRC validation', async () => {
  const bytes = await readFile(
    new URL(
      '../assets-source/body-fit-v2/armadura_paladina_verde_e_dourada.png',
      import.meta.url,
    ),
  );
  assert.equal(validatePngChunks(bytes).status, 'CRC_PASS');
});
test('corrupt payload is rejected even when the signature remains PNG', async () => {
  const bytes = await readFile(
    new URL(
      '../assets-source/body-fit-v2/armadura_paladina_verde_e_dourada.png',
      import.meta.url,
    ),
  );
  bytes[20] ^= 1;
  assert.throws(() => validatePngChunks(bytes), /CRC mismatch/);
});
test('non-PNG, truncated and appended data are rejected', async () => {
  assert.throws(() => validatePngChunks(Buffer.from('not a PNG')), /signature/);
  const bytes = await readFile(
    new URL(
      '../assets-source/body-fit-v2/armadura_paladina_verde_e_dourada.png',
      import.meta.url,
    ),
  );
  assert.throws(
    () => validatePngChunks(bytes.subarray(0, bytes.length - 1)),
    /Truncated/,
  );
  assert.throws(
    () => validatePngChunks(Buffer.concat([bytes, Buffer.from('extra')])),
    /trailing data/,
  );
});
