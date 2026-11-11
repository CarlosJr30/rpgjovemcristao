import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { renderFixture041 } from './render-fixture.mjs';
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const b = read('build/economy-041/fixture-baseline.json');
const credit = b.functions.find(
  (f) => f.signature === 'shop_qa_private.fixture_credit_014(uuid)',
).definition;
const actor = credit.match(/p_actor='([a-f0-9-]{36})'/)[1],
  owner = credit.match(/b.account_id='([a-f0-9-]{36})'/)[1];
const migration041 = read(
  'packages/database/deployments/economy041/test-manifest.json',
).migration;
const sql041 = fs.readFileSync(migration041, 'utf8');
// Existing function uses the literal pg_get_functiondef delimiter, not a SQL parser guess.
const start = sql041.indexOf(
  'CREATE OR REPLACE FUNCTION shop_private.coin_balance(p_actor uuid)',
);
const delimiter = '$function$';
if (start < 0) throw Error('Compiled TEST balance missing');
const first = sql041.indexOf(delimiter, start),
  end = sql041.indexOf(delimiter, first + delimiter.length);
if (first < 0 || end < 0) throw Error('Unexpected compiled balance boundary');
const prior = read('build/economy-041/test-baseline.json').functions.find(
  (f) => f.signature === 'shop_private.coin_balance(uuid)',
);
const balance = {
  ...prior,
  definition: sql041.slice(start, end + delimiter.length) + '\n',
};
const out = renderFixture041({
  owner,
  actor,
  balance,
  functions: b.functions,
  constraints: b.constraints,
});
const files = fs
  .readdirSync('supabase/migrations')
  .filter((n) => /^\d{14}_economy_041_fixture_test.sql$/.test(n));
if (files.length !== 1)
  throw Error('One CLI-created TEST fixture migration required');
const migration = 'supabase/migrations/' + files[0];
fs.writeFileSync(migration, out.sql);
fs.writeFileSync(
  'packages/database/deployments/economy041/fixture-test-recovery-empty.sql',
  out.recovery,
);
fs.writeFileSync(
  'packages/database/deployments/economy041/fixture-test-containment.sql',
  out.containment + '\n',
);
fs.writeFileSync(
  'packages/database/deployments/economy041/fixture-test-manifest.json',
  JSON.stringify(
    {
      environment: 'TEST ONLY',
      project: 'wkdvdzfkbwvhyjmamrsg',
      scope: 'hero-equipment-006',
      migration,
      sha256: createHash('sha256').update(out.sql).digest('hex'),
      approval: 'OWNER-TEST-FIXTURE-2000-2026-11-11',
      installationFunds: false,
      maxFunding: 2000,
      maxSmokePurchases: 50,
      preservePreviousBudget: true,
    },
    null,
    2,
  ) + '\n',
);
console.log(migration);
