// Local renderer only. The approved source snapshots stay in ignored build/; no remote mutations.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { renderEconomy041 } from './render.mjs';
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
for (const env of ['test', 'production']) {
  const names = fs
    .readdirSync('supabase/migrations')
    .filter((n) =>
      new RegExp('^\\d{14}_economy_041_' + env + '\\.sql$').test(n),
    );
  if (names.length !== 1)
    throw Error(
      'Create exactly one ' +
        env +
        ' migration using the pinned Supabase CLI first.',
    );
  const migration = 'supabase/migrations/' + names[0];
  const baseline = read('build/economy-041/' + env + '-baseline.json'),
    guild = read('build/economy-041/' + env + '-guild.json');
  const constraints =
    env === 'test'
      ? read('build/economy-041/test-schema.json').constraints
      : read('build/economy-041/production-constraints.json');
  const project =
      env === 'test' ? 'wkdvdzfkbwvhyjmamrsg' : 'wspafhlbtlpabypzymjo',
    scope = env === 'test' ? 'hero-equipment-006' : 'guild-ebd-001';
  const out = renderEconomy041({
    functions: [...baseline.functions, ...guild.functions],
    constraints,
    project,
    scope,
  });
  fs.writeFileSync(migration, out.sql);
  fs.writeFileSync(
    'packages/database/deployments/economy041/' + env + '-recovery-empty.sql',
    out.recovery,
  );
  fs.writeFileSync(
    'packages/database/deployments/economy041/' + env + '-containment.sql',
    `DO $$BEGIN IF current_setting('economy041.target_project',true) IS DISTINCT FROM '${project}' OR public.release_scope()<>'${scope}' THEN RAISE EXCEPTION 'Reviewed containment target required' USING ERRCODE='42501';END IF;END $$;\n` +
      out.containment +
      '\n',
  );
  const manifest = {
    environment: env,
    project,
    scope,
    contract: 'economy041-chest-v1',
    approvalRef: 'OWNER-ECONOMY-041-2026-11-11',
    migration,
    version: names[0].slice(0, 14),
    sha256: createHash('sha256').update(out.sql).digest('hex'),
    preservedOrAdaptedAuthorities: out.fingerprints,
  };
  fs.writeFileSync(
    'packages/database/deployments/economy041/' + env + '-manifest.json',
    JSON.stringify(manifest, null, 2) + '\n',
  );
  console.log(env, migration, manifest.sha256);
}
