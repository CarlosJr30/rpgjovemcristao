import assert from 'node:assert/strict';
import test from 'node:test';
import {
  COMMUNITY_PREVIEW,
  verifyCommunityTestPreview,
  validateCommunityDeployment,
  validateCommunityPreviewEnvironment,
  validateCommunityProject,
} from './community-test-preview.mjs';

const sha = 'a'.repeat(40);
const otherSha = 'b'.repeat(40);
const input = {
  sha,
  runId: '12345',
  attempt: '1',
  branch: COMMUNITY_PREVIEW.branch,
};
const envValues = {
  NEXT_PUBLIC_SUPABASE_URL: COMMUNITY_PREVIEW.testUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    'sb_publishable_test_key_12345678901234567890',
  SUPABASE_SERVICE_ROLE_KEY:
    'test-service-role-key-1234567890123456789012345678901234567890',
  NEXT_PUBLIC_COMMUNITY_CREATION_TEST: '1',
  NEXT_PUBLIC_VERCEL_ENV: 'preview',
  NEXT_PUBLIC_SHOP_PRODUCTION_RELEASE: '0',
  NEXT_PUBLIC_SHOP_RELEASE_PREVIEW: '0',
  NEXT_PUBLIC_SHOP_TEST_PREVIEW: '0',
  NEXT_PUBLIC_ECONOMY_QA002: '0',
  NEXT_PUBLIC_AVATAR_HD_LAB: '0',
};
const envs = () =>
  Object.entries(envValues).map(([key, value]) => ({
    key,
    value,
    target: ['preview'],
    gitBranch: COMMUNITY_PREVIEW.branch,
  }));
const project = () => ({
  id: COMMUNITY_PREVIEW.project,
  name: COMMUNITY_PREVIEW.projectName,
  accountId: COMMUNITY_PREVIEW.team,
  rootDirectory: COMMUNITY_PREVIEW.rootDirectory,
  link: {
    type: 'github',
    repoId: COMMUNITY_PREVIEW.repoId,
    productionBranch: 'main',
  },
  ssoProtection: { enabled: true },
});
const ready = (options = {}) => ({
  id: 'dpl_community123',
  projectId: COMMUNITY_PREVIEW.project,
  target: null,
  gitSource: { sha, repoId: COMMUNITY_PREVIEW.repoId },
  url: 'rpgjovemcristao-test-preview123-carlos-junior-s-projects.vercel.app',
  readyState: 'READY',
  ...options,
});

function fixture(options = {}) {
  const posts = [];
  const github = async (path) => {
    if (path.includes('/pulls/'))
      return {
        state: 'open',
        head: {
          repo: { full_name: COMMUNITY_PREVIEW.repository },
          ref: COMMUNITY_PREVIEW.branch,
          sha: options.prSha ?? sha,
        },
      };
    if (path.endsWith('/jobs?per_page=100'))
      return {
        total_count: COMMUNITY_PREVIEW.qualityJobs.length,
        jobs: COMMUNITY_PREVIEW.qualityJobs.map((name) => ({
          name,
          status: 'completed',
          conclusion: options.failedJob === name ? 'failure' : 'success',
        })),
      };
    return {
      repository: { full_name: COMMUNITY_PREVIEW.repository },
      head_sha: options.runSha ?? sha,
      head_branch: COMMUNITY_PREVIEW.branch,
      event: 'push',
      path: COMMUNITY_PREVIEW.qualityWorkflow,
      run_attempt: 1,
      conclusion: 'success',
    };
  };
  const vercel = async (path, request) => {
    if (request?.method === 'POST') {
      posts.push(request.body);
      if (options.timeout) throw new Error('simulated timeout');
      return { ...ready(), ...options.response };
    }
    if (path.startsWith('/v10/projects/') && path.includes('/env?'))
      return {
        envs: path.includes('decrypt=false')
          ? (options.unscopedEnvironment ?? [])
          : (options.environment ?? envs()),
        pagination: options.environmentPagination,
      };
    if (path.startsWith('/v9/projects/')) return options.project ?? project();
    if (path.startsWith('/v6/'))
      return {
        deployments:
          options.previous === 'duplicate'
            ? [
                {
                  uid: 'dpl_one',
                  gitSource: { sha, repoId: COMMUNITY_PREVIEW.repoId },
                  meta: {
                    communityTestPreviewSha: sha,
                    communityTestPreviewRepository:
                      COMMUNITY_PREVIEW.repository,
                  },
                },
                {
                  uid: 'dpl_two',
                  gitSource: { sha, repoId: COMMUNITY_PREVIEW.repoId },
                  meta: {
                    communityTestPreviewSha: sha,
                    communityTestPreviewRepository:
                      COMMUNITY_PREVIEW.repository,
                  },
                },
              ]
            : options.previous === 'unmanaged'
              ? [
                  {
                    uid: 'dpl_unmanaged',
                    gitSource: { sha, repoId: COMMUNITY_PREVIEW.repoId },
                  },
                ]
              : options.previous
                ? [
                    {
                      uid: 'dpl_existing',
                      gitSource: { sha, repoId: COMMUNITY_PREVIEW.repoId },
                      meta: {
                        communityTestPreviewSha: sha,
                        communityTestPreviewRepository:
                          COMMUNITY_PREVIEW.repository,
                      },
                    },
                  ]
                : [],
        pagination: options.deploymentPagination,
      };
    return { ...ready(), ...(options.polled ?? {}) };
  };
  const fetcher = async (url, request) => {
    assert.equal(url, `${COMMUNITY_PREVIEW.testUrl}/auth/v1/settings`);
    assert.equal(request.method, 'GET');
    assert.ok(
      [
        envValues.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        envValues.SUPABASE_SERVICE_ROLE_KEY,
      ].includes(request.headers.apikey),
    );
    return {
      status: options.keyStatus ?? 200,
      body: { cancel: async () => {} },
    };
  };
  return {
    posts,
    dependencies: {
      github,
      vercel,
      fetcher,
      wait: async () => {},
      maxPolls: 0,
    },
  };
}

test('accepts only exact branch-scoped TEST environment and returns credentials only to caller', () => {
  const result = validateCommunityPreviewEnvironment(envs());
  assert.equal(result.url, COMMUNITY_PREVIEW.testUrl);
  assert.equal(
    result.publicKey,
    envValues.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  assert.equal(result.serviceKey, envValues.SUPABASE_SERVICE_ROLE_KEY);
});

for (const [label, change] of [
  [
    'PROD URL',
    (rows) => {
      rows.find((x) => x.key === 'NEXT_PUBLIC_SUPABASE_URL').value =
        'https://wspafhlbtlpabypzymjo.supabase.co';
    },
  ],
  [
    'missing privileged TEST key',
    (rows) =>
      rows.splice(
        rows.findIndex((x) => x.key === 'SUPABASE_SERVICE_ROLE_KEY'),
        1,
      ),
  ],
  [
    'wrong branch scope',
    (rows) => {
      rows.find((x) => x.key === 'NEXT_PUBLIC_SUPABASE_URL').gitBranch = 'main';
    },
  ],
  [
    'Preview plus Production target',
    (rows) => {
      rows.find((x) => x.key === 'NEXT_PUBLIC_SUPABASE_URL').target = [
        'preview',
        'production',
      ];
    },
  ],
  [
    'enabled Shop release',
    (rows) => {
      rows.find((x) => x.key === 'NEXT_PUBLIC_SHOP_TEST_PREVIEW').value = '1';
    },
  ],
  [
    'duplicate backend URL',
    (rows) =>
      rows.push({ ...rows.find((x) => x.key === 'NEXT_PUBLIC_SUPABASE_URL') }),
  ],
  [
    'unscoped TEST key',
    (rows) =>
      rows.push({
        key: 'SUPABASE_SERVICE_ROLE_KEY',
        value: 'test-service-role-key-1234567890123456789012345678901234567890',
        target: ['preview'],
        gitBranch: null,
      }),
  ],
]) {
  test(`rejects unsafe Preview environment: ${label}`, () => {
    const rows = envs();
    change(rows);
    assert.throws(() => validateCommunityPreviewEnvironment(rows));
  });
}

test('requires the fixed TEST Vercel project, source link, root and SSO', () => {
  assert.doesNotThrow(() => validateCommunityProject(project()));
  for (const bad of [
    { ...project(), id: 'other' },
    { ...project(), accountId: 'other-team' },
    { ...project(), rootDirectory: '.' },
    { ...project(), link: { ...project().link, repoId: '2' } },
    { ...project(), ssoProtection: { enabled: false } },
  ])
    assert.throws(() => validateCommunityProject(bad));
});

test('deployment guard rejects Production target and foreign project/source/hostname', () => {
  assert.doesNotThrow(() => validateCommunityDeployment(ready(), sha));
  for (const bad of [
    ready({ target: 'production' }),
    ready({ projectId: 'other' }),
    ready({ gitSource: { sha: otherSha, repoId: COMMUNITY_PREVIEW.repoId } }),
    ready({ gitSource: { sha, repoId: '12' } }),
    ready({ url: 'example.invalid' }),
  ])
    assert.throws(() => validateCommunityDeployment(bad, sha));
});

test('pins exact PR head and required CI, then verifies the Git-created Preview', async () => {
  const f = fixture({ previous: true });
  const result = await verifyCommunityTestPreview(input, f.dependencies);
  assert.equal(result.sha, sha);
  assert.equal(result.state, 'READY');
  assert.equal(f.posts.length, 0);
});

for (const [label, options, candidateInput] of [
  ['PR head changed', { prSha: otherSha }],
  ['CI belongs to another SHA', { runSha: otherSha }],
  [
    'required PostgreSQL job failed',
    { failedJob: COMMUNITY_PREVIEW.qualityJobs[2] },
  ],
  [
    'Vercel SSO disabled',
    { project: { ...project(), ssoProtection: { enabled: false } } },
  ],
  [
    'branch environment has PROD URL',
    {
      environment: envs().map((x) =>
        x.key === 'NEXT_PUBLIC_SUPABASE_URL'
          ? { ...x, value: 'https://wspafhlbtlpabypzymjo.supabase.co' }
          : x,
      ),
    },
  ],
  ['TEST API rejects a key', { keyStatus: 401 }],
  ['duplicate deployment already exists', { previous: 'duplicate' }],
  [
    'unmanaged deployment already exists for this SHA',
    { previous: 'unmanaged' },
  ],
  [
    'unscoped backend key exists',
    {
      unscopedEnvironment: [
        {
          key: 'SUPABASE_SERVICE_ROLE_KEY',
          target: ['preview'],
          gitBranch: null,
        },
      ],
    },
  ],
  [
    'environment inventory is truncated',
    { environmentPagination: { next: 'cursor' } },
  ],
  [
    'deployment inventory is truncated',
    { previous: true, deploymentPagination: { next: 'cursor' } },
  ],
  ['second workflow attempt', {}, { ...input, attempt: '2' }],
]) {
  test(`fails closed before deployment when ${label}`, async () => {
    const f = fixture(options);
    await assert.rejects(
      verifyCommunityTestPreview(candidateInput ?? input, f.dependencies),
    );
    assert.equal(f.posts.length, 0);
  });
}

test('verifies one existing Git deployment without creating another', async () => {
  const f = fixture({ previous: true });
  const result = await verifyCommunityTestPreview(input, f.dependencies);
  assert.equal(result.state, 'READY');
  assert.equal(f.posts.length, 0);
});

test('requires the existing Git deployment and never creates one', async () => {
  const f = fixture();
  await assert.rejects(
    verifyCommunityTestPreview(input, f.dependencies),
    /Exactly one Git-created deployment/,
  );
  assert.equal(f.posts.length, 0);
});
