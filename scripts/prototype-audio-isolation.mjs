import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const REPOSITORY_ROOT = fileURLToPath(new URL('..', import.meta.url));
const policyFile = 'docs/architecture/PROTOTYPE-AUDIO-ISOLATION-V1.json';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const contained = (base, file) => {
  const relative = path.relative(base, file);
  return (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
};

export async function readPrototypePolicy(root = REPOSITORY_ROOT) {
  const policy = JSON.parse(
    await fs.readFile(path.join(root, policyFile), 'utf8'),
  );
  if (
    policy.version !== 1 ||
    policy.sourceRoot !== 'assets-source/arena-audio-prototype' ||
    policy.scope !== 'NON_COMMERCIAL_PROTOTYPE_DEVELOPMENT_ONLY' ||
    policy.receipts !== 'docs/architecture/audiovisual-pack-approvals.json' ||
    policy.items?.length !== 8
  )
    throw Error('Invalid prototype isolation policy');
  const approvals = JSON.parse(
    await fs.readFile(path.join(root, policy.receipts), 'utf8'),
  );
  const seen = new Set();
  for (const item of policy.items) {
    if (
      !/^audio\/(music|effects)\/[a-z_]+\.ogg$/.test(item.receiptKey) ||
      seen.has(item.receiptKey) ||
      item.originalPath !== `apps/web/public/assets/${item.receiptKey}` ||
      item.sourcePath !== `${policy.sourceRoot}/${item.receiptKey}` ||
      !/^[a-f0-9]{64}$/.test(item.sha256)
    ) {
      throw Error('Invalid or duplicate prototype source mapping');
    }
    seen.add(item.receiptKey);
    const receipt = approvals.files?.[item.receiptKey];
    if (
      !receipt ||
      receipt.sha256 !== item.sha256 ||
      receipt.licenseId !== 'SUNO_FREE_NON_COMMERCIAL' ||
      receipt.usageScope !== policy.scope ||
      receipt.commercialProductionApproved !== false ||
      receipt.reviewStatus !== 'APPROVED_FOR_PROTOTYPE'
    )
      throw Error('Prototype receipt contract changed');
  }
  return { ...policy, approvals };
}

export async function readPrototypeSource(root, policy, item) {
  const base = await fs.realpath(path.join(root, policy.sourceRoot));
  if (!contained(await fs.realpath(root), base))
    throw Error('Prototype root escapes repository');
  const real = await fs.realpath(path.join(root, item.sourcePath));
  if (!contained(base, real))
    throw Error('Prototype source escapes private root');
  const bytes = await fs.readFile(real);
  if (hash(bytes) !== item.sha256) throw Error('Prototype source hash changed');
  return bytes;
}

export async function assertPrototypeSources(root = REPOSITORY_ROOT) {
  const policy = await readPrototypePolicy(root);
  for (const item of policy.items)
    await readPrototypeSource(root, policy, item);
  return policy;
}

async function* filesUnder(directory) {
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  for (const entry of entries) {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink())
      throw Error(`Symlink in distributable directory: ${entry.name}`);
    if (entry.isDirectory()) yield* filesUnder(file);
    else if (entry.isFile()) yield file;
  }
}

// Inspect bytes as well as filenames: a renamed OGG or a byte-identical copy
// with a non-audio extension must not bypass the production gate.
export async function inspectDistributable(root, directories, policy) {
  const deniedHashes = new Set(policy.items.map((item) => item.sha256));
  const deniedNames = new Set(
    policy.items.map((item) => path.basename(item.receiptKey)),
  );
  const publicRoot = path.join(root, 'apps/web/public');
  const approvedAudio = new Set(
    Object.entries(policy.approvals.files)
      .filter(
        ([key, review]) =>
          key.startsWith('audio/') &&
          ['original', 'CC0-1.0', 'CC-BY-4.0'].includes(review.licenseId) &&
          review.presentationApproved === true &&
          review.licenseSource?.trim() &&
          review.author?.trim() &&
          review.reviewedBy?.trim() &&
          Number.isFinite(Date.parse(review.reviewedAt)) &&
          review.commercialProductionApproved !== false,
      )
      .map(([, review]) => review.sha256),
  );
  const findings = [];
  let scanned = 0;
  for (const directory of directories) {
    for await (const file of filesUnder(directory)) {
      scanned++;
      const relative = path.relative(root, file).replaceAll('\\', '/');
      const bytes = await fs.readFile(file);
      const digest = hash(bytes);
      const signature = bytes.subarray(0, 4).toString('ascii');
      const audio =
        /\.(ogg|mp3|wav|m4a|aac|flac|opus)$/i.test(file) ||
        signature === 'OggS' ||
        signature === 'fLaC' ||
        (signature === 'RIFF' &&
          bytes.subarray(8, 12).toString('ascii') === 'WAVE') ||
        bytes.subarray(0, 3).toString('ascii') === 'ID3';
      if (deniedNames.has(path.basename(file)) || deniedHashes.has(digest))
        findings.push({
          file: relative,
          reason: 'RESTRICTED_PROTOTYPE_MEDIA',
          sha256: digest,
        });
      else if (audio && !approvedAudio.has(digest))
        findings.push({
          file: relative,
          reason: 'AUDIO_WITHOUT_COMMERCIAL_RECEIPT',
          sha256: digest,
        });
      if (!contained(publicRoot, file) && /\.(js|json|mjs)$/.test(file)) {
        const text = bytes.toString('utf8');
        if (
          policy.items.some((item) =>
            text.includes(`/assets/${item.receiptKey}`),
          )
        )
          findings.push({
            file: relative,
            reason: 'PRODUCTION_RUNTIME_REFERENCES_PROTOTYPE_URL',
          });
        if (file.endsWith('.nft.json')) {
          const trace = JSON.parse(text);
          for (const reference of trace.files ?? []) {
            const resolved = path.resolve(path.dirname(file), reference);
            if (
              contained(path.join(root, policy.sourceRoot), resolved) ||
              deniedNames.has(path.basename(resolved))
            ) {
              findings.push({
                file: relative,
                reason: 'PROTOTYPE_SOURCE_IN_DEPLOY_TRACE',
                reference,
              });
            }
          }
        }
      }
    }
  }
  return { scanned, findings, pass: findings.length === 0 };
}

export async function assertProductionPublic(root = REPOSITORY_ROOT) {
  const policy = await readPrototypePolicy(root);
  const result = await inspectDistributable(
    root,
    [path.join(root, 'apps/web/public')],
    policy,
  );
  if (!result.pass)
    throw Error(
      `Production media gate failed: ${JSON.stringify(result.findings)}`,
    );
  return result;
}

export async function assertProductionArtifact(root = REPOSITORY_ROOT) {
  const policy = await assertPrototypeSources(root);
  const dist = path.join(
    root,
    'apps/web',
    process.env.RPG_MOBILE_E2E === '1' ? '.next/task-0062-mobile' : '.next',
  );
  await fs.access(path.join(dist, 'BUILD_ID'));
  const result = await inspectDistributable(
    root,
    [
      path.join(root, 'apps/web/public'),
      path.join(dist, 'static'),
      path.join(dist, 'server'),
      path.join(dist, 'standalone'),
      path.join(root, '.vercel/output'),
      path.join(root, 'apps/web/.vercel/output'),
    ],
    policy,
  );
  // required-server-files and the production server trace are outside server/.
  for (const name of [
    'next-server.js.nft.json',
    'required-server-files.json',
  ]) {
    let text;
    try {
      text = await fs.readFile(path.join(dist, name), 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    const trace = JSON.parse(text);
    for (const reference of trace.files ?? []) {
      const resolved = path.resolve(dist, reference);
      if (contained(path.join(root, policy.sourceRoot), resolved))
        result.findings.push({
          file: name,
          reason: 'PROTOTYPE_SOURCE_IN_DEPLOY_TRACE',
          reference,
        });
    }
  }
  result.pass = result.findings.length === 0;
  if (!result.pass)
    throw Error(
      `Production artifact gate failed: ${JSON.stringify(result.findings)}`,
    );
  return {
    ...result,
    sourceHashesPreserved: policy.items.length,
    dist: path.relative(root, dist).replaceAll('\\', '/'),
  };
}

async function main() {
  const mode = process.argv[2];
  if (!['--prebuild', '--prestart', '--artifact'].includes(mode))
    throw Error('Expected --prebuild, --prestart or --artifact');
  await assertPrototypeSources();
  const result =
    mode === '--prebuild'
      ? await assertProductionPublic()
      : await assertProductionArtifact();
  console.log(
    JSON.stringify({
      gate: 'PROTOTYPE_AUDIO_PRODUCTION_ISOLATION',
      mode,
      ...result,
    }),
  );
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
