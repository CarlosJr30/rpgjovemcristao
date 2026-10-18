import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deployPinnedPreview,
  project,
  team,
  repository,
} from './pinned-preview.mjs';

const sha = 'a'.repeat(40);
const otherSha = 'b'.repeat(40);
const input = {
  sha,
  branch: 'codex/pinned-preview-ci',
  runId: '123',
  attempt: '1',
};
const ready = () => ({
  id: 'dpl_test123',
  projectId: project,
  target: null,
  gitSource: { sha, repoId: '1384898873' },
  url: 'rpgjovemcristao-test123-carlos-junior-s-projects.vercel.app',
  readyState: 'READY',
});
function fixture(options = {}) {
  const posts = [];
  const github = async (path) =>
    path.includes('/jobs?')
      ? {
          total_count: 1,
          jobs: [
            {
              name: 'Testes, lint, tipos e build',
              status: 'completed',
              conclusion: options.quality ?? 'success',
            },
          ],
        }
      : {
          repository: { full_name: repository },
          head_sha: options.runSha ?? sha,
          head_branch: input.branch,
          event: 'push',
          path: '.github/workflows/quality.yml',
          run_attempt: 1,
        };
  const vercel = async (path, request) => {
    if (request?.method === 'POST') {
      posts.push(request.body);
      if (options.timeout) throw new Error('simulated timeout');
      return { ...ready(), ...options.response };
    }
    if (path.startsWith('/v9/'))
      return {
        id: project,
        accountId: team,
        rootDirectory: 'apps/web',
        link: {
          type: 'github',
          repoId: '1384898873',
          productionBranch: 'main',
        },
      };
    if (path.startsWith('/v6/'))
      return {
        deployments: options.previous
          ? [
              {
                uid: 'dpl_test123',
                meta: { rpgReleaseSha: sha, rpgReleaseRepository: repository },
              },
            ]
          : [],
      };
    return { ...ready(), ...options.polled };
  };
  return {
    posts,
    dependencies: { github, vercel, wait: async () => {}, maxPolls: 1 },
  };
}

test('pins approved SHA even when the source branch has advanced', async () => {
  const f = fixture();
  const remoteBranchNow = otherSha;
  const result = await deployPinnedPreview(input, f.dependencies);
  assert.notEqual(remoteBranchNow, sha);
  assert.equal(f.posts[0].gitSource.sha, sha);
  assert.equal(Object.hasOwn(f.posts[0], 'target'), false);
  assert.equal(f.posts[0].gitSource.ref, input.branch);
  assert.equal(result.sha, sha);
  assert.equal(f.posts.length, 1);
});
test('quality failure prevents any deployment request', async () => {
  const f = fixture({ quality: 'failure' });
  await assert.rejects(
    deployPinnedPreview(input, f.dependencies),
    /no successful quality/,
  );
  assert.equal(f.posts.length, 0);
});
test('a successful run for another SHA is rejected', async () => {
  const f = fixture({ runSha: otherSha });
  await assert.rejects(
    deployPinnedPreview(input, f.dependencies),
    /provenance/,
  );
  assert.equal(f.posts.length, 0);
});
for (const branch of [
  'main',
  'cloud/preview-release-gate-007',
  'preview/../main',
])
  test(`rejects unauthorized branch ${branch}`, async () => {
    const f = fixture();
    await assert.rejects(
      deployPinnedPreview({ ...input, branch }, f.dependencies),
      /Unapproved/,
    );
    assert.equal(f.posts.length, 0);
  });
test('reruns cannot duplicate the POST', async () => {
  const f = fixture();
  await assert.rejects(
    deployPinnedPreview({ ...input, attempt: '2' }, f.dependencies),
    /first workflow attempt/,
  );
  assert.equal(f.posts.length, 0);
});
test('timeout does not retry a possibly accepted POST', async () => {
  const f = fixture({ timeout: true });
  await assert.rejects(deployPinnedPreview(input, f.dependencies), /timeout/);
  assert.equal(f.posts.length, 1);
});
for (const response of [
  { gitSource: { sha: otherSha, repoId: '1384898873' } },
  { target: 'production' },
  { projectId: 'other-project' },
  { url: 'attacker.invalid' },
])
  test(`rejects incorrect deployment result ${JSON.stringify(response)}`, async () => {
    const f = fixture({ response });
    await assert.rejects(deployPinnedPreview(input, f.dependencies));
  });
test('reuses an existing READY release without posting again', async () => {
  const f = fixture({ previous: true });
  assert.equal(
    (await deployPinnedPreview(input, f.dependencies)).state,
    'READY',
  );
  assert.equal(f.posts.length, 0);
});
test('polls the same deployment until READY', async () => {
  const f = fixture({ response: { readyState: 'BUILDING' } });
  assert.equal(
    (await deployPinnedPreview(input, f.dependencies)).state,
    'READY',
  );
  assert.equal(f.posts.length, 1);
});
test('failed deployment is not automatically recreated', async () => {
  const f = fixture({ previous: true, polled: { readyState: 'ERROR' } });
  await assert.rejects(
    deployPinnedPreview(input, f.dependencies),
    /Deployment failed/,
  );
  assert.equal(f.posts.length, 0);
});
