import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const COMMUNITY_PREVIEW = Object.freeze({
  repository: 'CarlosJr30/rpgjovemcristao',
  repoId: '1384898873',
  pullRequest: 55,
  branch: 'codex/rpg-community-043b-impl-1',
  team: 'team_FWD8MfZ9vARK8EBovoyTn9Ox',
  project: 'prj_qKzjXMVXwiVpGlU66SoTA71mStXX',
  projectName: 'rpgjovemcristao-test',
  testRef: 'wkdvdzfkbwvhyjmamrsg',
  productionRef: 'wspafhlbtlpabypzymjo',
  testUrl: 'https://wkdvdzfkbwvhyjmamrsg.supabase.co',
  rootDirectory: 'apps/web',
  qualityWorkflow: '.github/workflows/quality.yml',
  qualityJobs: [
    'Testes, lint, tipos e build',
    'Reprodução e contraste RSC isolados',
    'PostgreSQL isolado — governança010A',
  ],
});

const requiredTestEnvironment = Object.freeze({
  NEXT_PUBLIC_SUPABASE_URL: COMMUNITY_PREVIEW.testUrl,
  NEXT_PUBLIC_COMMUNITY_CREATION_TEST: '1',
  NEXT_PUBLIC_VERCEL_ENV: 'preview',
  NEXT_PUBLIC_SHOP_PRODUCTION_RELEASE: '0',
  NEXT_PUBLIC_SHOP_RELEASE_PREVIEW: '0',
  NEXT_PUBLIC_SHOP_TEST_PREVIEW: '0',
  NEXT_PUBLIC_ECONOMY_QA002: '0',
  NEXT_PUBLIC_AVATAR_HD_LAB: '0',
});

function requireSafe(condition, message) {
  if (!condition) throw new Error(message);
}

function requireCompleteList(response, label) {
  requireSafe(
    Array.isArray(response?.envs ?? response?.deployments),
    `${label} inventory is unavailable.`,
  );
  requireSafe(
    !response.pagination?.next,
    `${label} inventory is truncated; inspect manually.`,
  );
}

function configuredBranchVariables(envs) {
  requireSafe(
    Array.isArray(envs),
    'Preview environment inventory is unavailable.',
  );
  const selected = new Map();
  for (const item of envs) {
    if (item.gitBranch !== COMMUNITY_PREVIEW.branch) continue;
    requireSafe(
      Array.isArray(item.target) &&
        item.target.length === 1 &&
        item.target[0] === 'preview',
      'Community Preview variable is not scoped exclusively to Preview.',
    );
    requireSafe(
      typeof item.key === 'string' && typeof item.value === 'string',
      'Community Preview variable is missing its value.',
    );
    requireSafe(
      !selected.has(item.key),
      `Duplicate Preview variable: ${item.key}.`,
    );
    selected.set(item.key, item.value);
  }
  return selected;
}

export function validateCommunityPreviewEnvironment(envs) {
  const values = configuredBranchVariables(envs);
  const isolatedBackendKeys = new Set([
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_COMMUNITY_CREATION_TEST',
    'NEXT_PUBLIC_VERCEL_ENV',
    'NEXT_PUBLIC_SHOP_PRODUCTION_RELEASE',
    'NEXT_PUBLIC_SHOP_RELEASE_PREVIEW',
    'NEXT_PUBLIC_SHOP_TEST_PREVIEW',
    'NEXT_PUBLIC_ECONOMY_QA002',
    'NEXT_PUBLIC_AVATAR_HD_LAB',
  ]);
  for (const item of envs) {
    if (item.gitBranch === COMMUNITY_PREVIEW.branch) continue;
    if (Array.isArray(item.target) && item.target.includes('preview'))
      requireSafe(
        !isolatedBackendKeys.has(item.key),
        `Unscoped Preview variable is forbidden for ${item.key}.`,
      );
  }
  const required = [
    ...Object.keys(requiredTestEnvironment),
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  for (const key of required)
    requireSafe(
      values.has(key),
      `Missing branch-scoped TEST variable: ${key}.`,
    );

  for (const [key, expected] of Object.entries(requiredTestEnvironment))
    requireSafe(values.get(key) === expected, `Unexpected value for ${key}.`);

  const publicKey = values.get('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  const serviceKey = values.get('SUPABASE_SERVICE_ROLE_KEY');
  requireSafe(
    publicKey.trim().length >= 20,
    'TEST publishable key is invalid.',
  );
  requireSafe(serviceKey.trim().length >= 40, 'TEST server key is invalid.');
  for (const value of values.values())
    requireSafe(
      !value.includes(COMMUNITY_PREVIEW.productionRef),
      'Production Supabase reference rejected in Preview configuration.',
    );
  return { url: values.get('NEXT_PUBLIC_SUPABASE_URL'), publicKey, serviceKey };
}

export function validateCommunityProject(project) {
  requireSafe(
    project?.id === COMMUNITY_PREVIEW.project &&
      project?.name === COMMUNITY_PREVIEW.projectName &&
      project?.accountId === COMMUNITY_PREVIEW.team,
    'Vercel TEST project or team identity differs.',
  );
  requireSafe(
    project?.rootDirectory === COMMUNITY_PREVIEW.rootDirectory,
    'Vercel TEST project root directory is not apps/web.',
  );
  requireSafe(
    project?.link?.type === 'github' &&
      String(project?.link?.repoId) === COMMUNITY_PREVIEW.repoId &&
      project?.link?.productionBranch === 'main',
    'Vercel TEST project is not linked to the fixed Git repository and main branch.',
  );
  requireSafe(
    project?.ssoProtection?.enabled === true,
    'Vercel SSO must remain enabled for the TEST Preview project.',
  );
}

export function validateCommunityCandidate({
  sha,
  runId,
  attempt = '1',
  branch,
}) {
  requireSafe(
    /^[a-f0-9]{40}$/.test(sha ?? ''),
    'A full lowercase SHA is required.',
  );
  requireSafe(
    branch === COMMUNITY_PREVIEW.branch,
    'Unexpected COMMUNITY candidate branch.',
  );
  requireSafe(
    /^[0-9]+$/.test(runId ?? '') && attempt === '1',
    'Only a first-attempt CI run is accepted.',
  );
}

export function validateCommunityDeployment(deployment, sha) {
  requireSafe(
    deployment?.projectId === COMMUNITY_PREVIEW.project,
    'Deployment belongs to a different Vercel project.',
  );
  requireSafe(
    deployment?.target == null || deployment.target === 'preview',
    'Production or custom-environment deployment rejected.',
  );
  requireSafe(
    deployment?.gitSource?.sha === sha &&
      String(deployment?.gitSource?.repoId) === COMMUNITY_PREVIEW.repoId,
    'Deployment Git provenance differs from the approved SHA/repository.',
  );
  requireSafe(
    /^dpl_[a-zA-Z0-9]+$/.test(deployment?.id ?? ''),
    'Invalid Vercel deployment identifier.',
  );
  requireSafe(
    /^rpgjovemcristao-test-[a-z0-9-]+-carlos-junior-s-projects\.vercel\.app$/.test(
      deployment?.url ?? '',
    ),
    'Unexpected TEST Preview hostname.',
  );
}

async function verifyTestApiKeys({ url, publicKey, serviceKey }, fetcher) {
  for (const key of [publicKey, serviceKey]) {
    let response;
    try {
      response = await fetcher(`${url}/auth/v1/settings`, {
        method: 'GET',
        redirect: 'error',
        headers: { apikey: key, accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new Error(
        'TEST backend key verification failed; no deployment requested.',
      );
    }
    await response.body?.cancel();
    requireSafe(
      response.status === 200,
      'A configured key was not accepted by Supabase TEST.',
    );
  }
}

export async function verifyCommunityTestPreview(
  input,
  {
    github,
    vercel,
    fetcher = fetch,
    wait = (ms) => new Promise((r) => setTimeout(r, ms)),
    maxPolls = 120,
  },
) {
  const { sha, runId, attempt = '1', branch } = input;
  validateCommunityCandidate({ sha, runId, attempt, branch });

  const pr = await github(
    `/repos/${COMMUNITY_PREVIEW.repository}/pulls/${COMMUNITY_PREVIEW.pullRequest}`,
  );
  requireSafe(
    pr?.state === 'open' &&
      pr?.head?.repo?.full_name === COMMUNITY_PREVIEW.repository &&
      pr?.head?.ref === COMMUNITY_PREVIEW.branch &&
      pr?.head?.sha === sha,
    'Candidate is not the current head of the open COMMUNITY PR #55.',
  );

  const run = await github(
    `/repos/${COMMUNITY_PREVIEW.repository}/actions/runs/${runId}`,
  );
  requireSafe(
    run?.repository?.full_name === COMMUNITY_PREVIEW.repository &&
      run?.head_sha === sha &&
      run?.head_branch === branch &&
      run?.event === 'push' &&
      run?.path === COMMUNITY_PREVIEW.qualityWorkflow &&
      run?.run_attempt === 1 &&
      run?.conclusion === 'success',
    'No successful first-attempt quality workflow exists for the exact candidate SHA.',
  );
  const jobs = await github(
    `/repos/${COMMUNITY_PREVIEW.repository}/actions/runs/${runId}/jobs?per_page=100`,
  );
  requireSafe(
    jobs?.total_count <= 100 &&
      COMMUNITY_PREVIEW.qualityJobs.every((name) =>
        jobs.jobs?.some(
          (job) =>
            job.name === name &&
            job.status === 'completed' &&
            job.conclusion === 'success',
        ),
      ),
    'One or more required CI jobs did not pass for the candidate SHA.',
  );

  const project = await vercel(
    `/v9/projects/${COMMUNITY_PREVIEW.project}?teamId=${COMMUNITY_PREVIEW.team}`,
  );
  validateCommunityProject(project);
  const envResponse = await vercel(
    `/v10/projects/${COMMUNITY_PREVIEW.project}/env?teamId=${COMMUNITY_PREVIEW.team}&limit=100&decrypt=true&gitBranch=${encodeURIComponent(COMMUNITY_PREVIEW.branch)}`,
  );
  const unscopedResponse = await vercel(
    `/v10/projects/${COMMUNITY_PREVIEW.project}/env?teamId=${COMMUNITY_PREVIEW.team}&limit=100&decrypt=false`,
  );
  requireCompleteList(envResponse, 'Branch-scoped Vercel environment');
  requireCompleteList(unscopedResponse, 'Vercel environment');
  const branchEnv = envResponse.envs ?? [];
  const unscopedMetadata = (unscopedResponse.envs ?? []).filter(
    (item) => item.gitBranch !== COMMUNITY_PREVIEW.branch,
  );
  const backend = validateCommunityPreviewEnvironment([
    ...branchEnv,
    ...unscopedMetadata,
  ]);
  await verifyTestApiKeys(backend, fetcher);

  const previous = await vercel(
    `/v6/deployments?projectId=${COMMUNITY_PREVIEW.project}&teamId=${COMMUNITY_PREVIEW.team}&limit=100`,
  );
  requireCompleteList(previous, 'Vercel deployment');
  const candidates = (previous.deployments ?? []).filter(
    (deployment) =>
      deployment.gitSource?.sha === sha &&
      String(deployment.gitSource?.repoId) === COMMUNITY_PREVIEW.repoId,
  );
  requireSafe(
    candidates.length <= 1,
    'Duplicate deployments exist for this COMMUNITY SHA; inspect manually.',
  );

  requireSafe(
    candidates.length === 1,
    'Exactly one Git-created deployment for this SHA is required; no deployment was requested.',
  );
  requireSafe(
    candidates[0].meta?.communityTestPreviewSha === sha &&
      candidates[0].meta?.communityTestPreviewRepository ===
        COMMUNITY_PREVIEW.repository,
    'The existing deployment is not tagged for this verified COMMUNITY candidate.',
  );
  requireSafe(
    /^dpl_[a-zA-Z0-9]+$/.test(candidates[0].uid ?? ''),
    'Invalid existing deployment identifier.',
  );
  let deployment = await vercel(
    `/v13/deployments/${candidates[0].uid}?teamId=${COMMUNITY_PREVIEW.team}`,
  );

  for (let poll = 0; poll <= maxPolls; poll++) {
    validateCommunityDeployment(deployment, sha);
    const state = deployment.readyState ?? deployment.status;
    if (state === 'READY')
      return {
        id: deployment.id,
        sha,
        url: `https://${deployment.url}`,
        state,
      };
    requireSafe(
      !['ERROR', 'CANCELED', 'BLOCKED'].includes(state),
      'Existing Preview deployment failed.',
    );
    requireSafe(
      poll < maxPolls,
      'Timed out awaiting the same Preview deployment; inspect before retrying.',
    );
    await wait(5000);
    deployment = await vercel(
      `/v13/deployments/${deployment.id}?teamId=${COMMUNITY_PREVIEW.team}`,
    );
  }
}

function api(origin, token) {
  return async (path, options = {}) => {
    requireSafe(
      (options.method ?? 'GET') === 'GET',
      'Community Preview verification is read-only.',
    );
    let response;
    try {
      response = await fetch(new URL(path, origin), {
        method: options.method ?? 'GET',
        redirect: 'error',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(origin.includes('api.github.com')
            ? { 'X-GitHub-Api-Version': '2022-11-28' }
            : {}),
        },
        signal: AbortSignal.timeout(30000),
      });
    } catch {
      throw new Error(
        'Release API request failed or timed out; no automatic retry.',
      );
    }
    requireSafe(
      response.ok,
      `Release API request rejected (HTTP ${response.status}); response body suppressed.`,
    );
    try {
      return await response.json();
    } catch {
      throw new Error(
        'Release API response was not valid JSON; body suppressed.',
      );
    }
  };
}

export async function main() {
  requireSafe(
    process.env.GITHUB_REPOSITORY === COMMUNITY_PREVIEW.repository &&
      process.env.GITHUB_EVENT_NAME === 'workflow_dispatch' &&
      process.env.GITHUB_REF === 'refs/heads/main' &&
      process.env.GITHUB_RUN_ATTEMPT === '1',
    'Only a first-attempt protected dispatch from main can request COMMUNITY TEST Preview.',
  );
  requireSafe(
    process.env.GH_TOKEN && process.env.VERCEL_TOKEN,
    'Protected GitHub/Vercel credentials are required.',
  );
  const result = await verifyCommunityTestPreview(
    {
      sha: process.env.COMMUNITY_CANDIDATE_SHA,
      runId: process.env.COMMUNITY_QUALITY_RUN_ID,
      branch: COMMUNITY_PREVIEW.branch,
      attempt: '1',
    },
    {
      github: api('https://api.github.com', process.env.GH_TOKEN),
      vercel: api('https://api.vercel.com', process.env.VERCEL_TOKEN),
    },
  );
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `url=${result.url}\nsha=${result.sha}\ndeployment=${result.id}\n`,
    );
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `COMMUNITY TEST Preview READY for \`${result.sha}\`: ${result.url}/auth\n`,
    );
  console.log(JSON.stringify(result));
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
