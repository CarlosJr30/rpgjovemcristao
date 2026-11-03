import fs from 'node:fs';
// No production package before real TEST homologation. TEST designates no real user.
const replace = (s) =>
  s
    .replaceAll('__PROJECT__', 'wkdvdzfkbwvhyjmamrsg')
    .replaceAll('__SCOPE__', 'hero-equipment-006')
    .replaceAll('__OWNER__', '00000000-0000-4000-8000-000000000002')
    .replaceAll('__ACTOR__', '00000000-0000-4000-8000-000000000003')
    .replaceAll('__ENV__', 'TEST-NO-REAL-DESIGNATION');
fs.writeFileSync(
  'supabase/migrations/20261103093714_economy_qa_002_isolated_training_test.sql',
  '-- TEST ONLY. No real account or budget designated.\n' +
    replace(
      fs.readFileSync(
        'packages/database/proposals/economy-qa-002.sql.in',
        'utf8',
      ),
    ),
);
