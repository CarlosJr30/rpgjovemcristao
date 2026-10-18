import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const project = 'prj_mG2ZSDaSc5i2Pz2uqKSlCzSGiVmG';
export const team = 'team_FWD8MfZ9vARK8EBovoyTn9Ox';
export const repository = 'CarlosJr30/rpgjovemcristao';
const repoId = '1384898873';
const qualityName = 'Testes, lint, tipos e build';

function requireSafe(condition, message) {
  if (!condition) throw new Error(message);
}

function verifyDeployment(deployment, sha) {
  requireSafe(
    deployment.projectId === project,
    'Deployment belongs to a different project.',
  );
  requireSafe(
    !deployment.target || deployment.target === 'preview',
    'Production deployment rejected.',
  );
  requireSafe(
    deployment.gitSource?.sha === sha,
    'Actual deployment SHA differs from the tested commit.',
  );
  requireSafe(
    String(deployment.gitSource?.repoId) === repoId,
    'Deployment repository differs.',
  );
  requireSafe(
    /^dpl_[a-zA-Z0-9]+$/.test(deployment.id),
    'Invalid deployment identifier.',
  );
  requireSafe(
    /^rpgjovemcristao-[a-z0-9]+-carlos-junior-s-projects\.vercel\.app$/.test(
      deployment.url,
    ),
    'Unexpected preview hostname.',
  );
}

export async function deployPinnedPreview(
  input,
  {
    github,
    vercel,
    wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    maxPolls = 120,
  },
) {
  const { sha, branch, runId, attempt = '1' } = input;
  requireSafe(
    /^[a-f0-9]{40}$/.test(sha ?? ''),
    'A full lowercase commit SHA is required.',
  );
  requireSafe(
    /^(preview\/[a-zA-Z0-9._/-]+|codex\/pinned-preview-ci)$/.test(
      branch ?? '',
    ) && !branch.includes('..'),
    'Unapproved preview branch.',
  );
  requireSafe(
    /^[0-9]+$/.test(runId ?? '') && attempt === '1',
    'Only the first workflow attempt can request deployment.',
  );

  const run = await github(`/repos/${repository}/actions/runs/${runId}`);
  requireSafe(
    run.repository?.full_name === repository &&
      run.head_sha === sha &&
      run.head_branch === branch &&
      run.event === 'push' &&
      run.path === '.github/workflows/quality.yml' &&
      run.run_attempt === 1,
    'Workflow provenance does not match the requested release.',
  );
  const jobs = await github(
    `/repos/${repository}/actions/runs/${runId}/jobs?per_page=100`,
  );
  requireSafe(
    jobs.total_count <= 100 &&
      jobs.jobs?.some(
        (job) =>
          job.name === qualityName &&
          job.status === 'completed' &&
          job.conclusion === 'success',
      ),
    'The exact commit has no successful quality job.',
  );

  const settings = await vercel(`/v9/projects/${project}?teamId=${team}`);
  requireSafe(
    settings.id === project &&
      settings.accountId === team &&
      settings.rootDirectory === 'apps/web' &&
      settings.link?.type === 'github' &&
      String(settings.link?.repoId) === repoId &&
      settings.link?.productionBranch === 'main',
    'Vercel project configuration differs from the authorized target.',
  );
  const previous = await vercel(
    `/v6/deployments?projectId=${project}&teamId=${team}&limit=100`,
  );
  const candidates =
    previous.deployments?.filter(
      (deployment) =>
        deployment.meta?.rpgReleaseSha === sha &&
        deployment.meta?.rpgReleaseRepository === repository,
    ) ?? [];
  requireSafe(
    candidates.length <= 1,
    'More than one release exists for this SHA; inspect Vercel manually.',
  );

  let deployment;
  if (candidates.length) {
    requireSafe(
      /^dpl_[a-zA-Z0-9]+$/.test(candidates[0].uid),
      'Invalid existing deployment identifier.',
    );
    deployment = await vercel(
      `/v13/deployments/${candidates[0].uid}?teamId=${team}`,
    );
  } else {
    // Both ref and sha are supplied. A later push cannot replace this source.
    // Never retry this POST: timeout may mean the deployment already exists.
    deployment = await vercel(`/v13/deployments?teamId=${team}`, {
      method: 'POST',
      body: {
        name: 'rpgjovemcristao-web',
        project,
        // Preview is the API default. The literal target "preview" is rejected.
        gitSource: { type: 'github', repoId, ref: branch, sha },
        meta: {
          rpgReleaseSha: sha,
          rpgReleaseRepository: repository,
          rpgQualityRun: runId,
        },
      },
    });
  }
  for (let poll = 0; poll <= maxPolls; poll++) {
    verifyDeployment(deployment, sha);
    const state = deployment.readyState ?? deployment.status;
    if (state === 'READY')
      return {
        sha,
        id: deployment.id,
        url: `https://${deployment.url}`,
        state,
      };
    requireSafe(
      !['ERROR', 'CANCELED', 'BLOCKED'].includes(state),
      'Deployment failed; automatic redeployment is disabled.',
    );
    requireSafe(
      poll < maxPolls,
      'Timed out awaiting READY; inspect the existing deployment before retrying.',
    );
    await wait(5000);
    deployment = await vercel(
      `/v13/deployments/${deployment.id}?teamId=${team}`,
    );
  }
}

function api(origin, token) {
  return async (path, options = {}) => {
    let response;
    try {
      response = await fetch(new URL(path, origin), {
        method: options.method ?? 'GET',
        redirect: 'error',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: AbortSignal.timeout(30000),
      });
    } catch {
      throw new Error('API request failed or timed out; no automatic retry.');
    }
    requireSafe(
      response.ok,
      `API request rejected (HTTP ${response.status}); response body suppressed.`,
    );
    try {
      return await response.json();
    } catch {
      throw new Error('API response was not valid JSON; body suppressed.');
    }
  };
}

export async function main() {
  requireSafe(
    process.env.GITHUB_REPOSITORY === repository &&
      process.env.GITHUB_EVENT_NAME === 'push',
    'Only a trusted repository push can release.',
  );
  requireSafe(
    process.env.GH_TOKEN && process.env.VERCEL_TOKEN,
    'Configure VERCEL_TOKEN directly in the protected preview-deploy environment.',
  );
  const result = await deployPinnedPreview(
    {
      sha: process.env.GITHUB_SHA,
      branch: process.env.GITHUB_REF_NAME,
      runId: process.env.GITHUB_RUN_ID,
      attempt: process.env.GITHUB_RUN_ATTEMPT,
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
      `Preview READY for tested commit \`${result.sha}\`: [open preview](${result.url}/journey).\n`,
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
