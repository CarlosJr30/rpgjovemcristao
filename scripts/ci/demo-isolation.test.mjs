import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasReviewedDemo,
  reviewedDemo,
  reviewedDemoIssues,
} from './demo-isolation.mjs';

export const demoTree = () => ({
  truncated: false,
  tree: Object.entries(reviewedDemo).map(([path, sha]) => ({
    path,
    sha,
    type: 'blob',
    mode: '100644',
  })),
});

test('diagnostics distinguish missing and changed boundaries without authorizing them', () => {
  const source = demoTree();
  const removed = source.tree.pop();
  source.tree[0].sha = '0'.repeat(40);
  const issues = reviewedDemoIssues(source);
  assert.equal(issues.length, 2);
  assert.ok(
    issues.some(
      (issue) => issue.path === removed.path && issue.reason === 'missing',
    ),
  );
  assert.ok(
    issues.some(
      (issue) =>
        issue.path === source.tree[0].path && issue.reason === 'changed',
    ),
  );
  assert.equal(hasReviewedDemo(source), false);
});

test('diagnostics reject truncated, duplicate and non-regular entries', () => {
  assert.deepEqual(reviewedDemoIssues({ ...demoTree(), truncated: true }), [
    { reason: 'incomplete-tree' },
  ]);
  const source = demoTree();
  source.tree.push(source.tree[0]);
  source.tree[1].mode = '120000';
  assert.ok(
    reviewedDemoIssues(source).some((issue) => issue.reason === 'duplicate'),
  );
  assert.ok(
    reviewedDemoIssues(source).some(
      (issue) => issue.reason === 'invalid-entry',
    ),
  );
  assert.equal(hasReviewedDemo(source), false);
  assert.deepEqual(reviewedDemoIssues(demoTree()), []);
});

test('accepts the complete reviewed demo boundary', () =>
  assert.equal(hasReviewedDemo(demoTree()), true));
test('rejects ordinary production sources', () =>
  assert.equal(hasReviewedDemo({ truncated: false, tree: [] }), false));
for (const path of Object.keys(reviewedDemo)) {
  test(`rejects changed isolation source ${path}`, () => {
    const source = demoTree();
    source.tree.find((entry) => entry.path === path).sha = '0'.repeat(40);
    assert.equal(hasReviewedDemo(source), false);
  });
}
test('rejects missing files, symlinks, duplicate entries and truncated API trees', () => {
  const source = demoTree();
  source.tree.pop();
  assert.equal(hasReviewedDemo(source), false);
  const symlink = demoTree();
  symlink.tree[0].mode = '120000';
  assert.equal(hasReviewedDemo(symlink), false);
  const duplicate = demoTree();
  duplicate.tree.push(duplicate.tree[0]);
  assert.equal(hasReviewedDemo(duplicate), false);
  assert.equal(hasReviewedDemo({ ...demoTree(), truncated: true }), false);
  assert.equal(hasReviewedDemo(null), false);
});
