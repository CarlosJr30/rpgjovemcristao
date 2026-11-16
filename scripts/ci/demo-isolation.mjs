import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// Canonical Git blobs reviewed in isolated demo commit 9e501ea275f3019991ec9ac233d58790946daf51.
// A changed isolation boundary requires a fresh security review and explicit update.
export const reviewedDemo = Object.freeze({
  'apps/web/app/journey/arena/legacy/page.tsx':
    '2f97373866ffe39aee876646222fefcb9defdb98',
  'apps/web/app/journey/arena/page.tsx':
    '4ace464af44fe621727043014c257f245cb906ed',
  'apps/web/app/journey/page.tsx': 'dba123fe40b983d0fe1eb67e4518650c005d9e93',
  'apps/web/app/layout.tsx': 'f29174a4d0db2477edbc0ca7d2d17a307c069f54',
  'apps/web/lib/arena-preview.ts': '1d5ca34626a7183e9ae7a2a72c63847e12bb4d78',
  'apps/web/proxy.ts': '853edf7a08597af2c27fcf82fd33bb3aa81394da',
});

export function hasReviewedDemo(source) {
  if (source?.truncated !== false || !Array.isArray(source.tree)) return false;
  return Object.entries(reviewedDemo).every(([path, sha]) => {
    const matches = source.tree.filter((entry) => entry.path === path);
    return (
      matches.length === 1 &&
      matches[0].type === 'blob' &&
      matches[0].mode === '100644' &&
      matches[0].sha === sha
    );
  });
}

// Diagnostics only: never updates the reviewed hashes or authorizes a source.
export function reviewedDemoIssues(source) {
  if (source?.truncated !== false || !Array.isArray(source.tree))
    return [{ reason: 'incomplete-tree' }];
  return Object.entries(reviewedDemo).flatMap(([path, expected]) => {
    const matches = source.tree.filter((entry) => entry.path === path);
    if (matches.length !== 1)
      return [{ path, reason: matches.length ? 'duplicate' : 'missing' }];
    const actual = matches[0];
    if (actual.type !== 'blob' || actual.mode !== '100644')
      return [{ path, reason: 'invalid-entry' }];
    return actual.sha === expected
      ? []
      : [{ path, reason: 'changed', expected, actual: actual.sha }];
  });
}

function localDemoSource() {
  const output = execFileSync(
    'git',
    ['ls-tree', '-r', 'HEAD', '--', ...Object.keys(reviewedDemo)],
    { encoding: 'utf8' },
  );
  const tree = output
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [metadata, path] = line.split('\t');
      const [mode, type, sha] = metadata.split(' ');
      return { mode, type, sha, path };
    });
  return { truncated: false, tree };
}

export function localDemoEligibility() {
  return hasReviewedDemo(localDemoSource());
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(`eligible=${localDemoEligibility()}`);
  if (process.argv.includes('--explain'))
    console.log(JSON.stringify(reviewedDemoIssues(localDemoSource()), null, 2));
}
