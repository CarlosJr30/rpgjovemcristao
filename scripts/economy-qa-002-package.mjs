import fs from 'node:fs';
// One owner-approved TEST designation. No production activation in this task.
const designation = JSON.parse(
  fs.readFileSync(
    'packages/database/proposals/economy-qa-002-test-designation.json',
    'utf8',
  ),
);
const replace = (s) =>
  s
    .replaceAll('__PROJECT__', 'wkdvdzfkbwvhyjmamrsg')
    .replaceAll('__SCOPE__', 'hero-equipment-006')
    .replaceAll('__OWNER__', designation.owner)
    .replaceAll('__ACTOR__', designation.actor)
    .replaceAll('__ENV__', designation.approval);
fs.writeFileSync(
  'supabase/migrations/20261103093714_economy_qa_002_isolated_training_test.sql',
  '-- TEST ONLY. Single QA identity designated by explicit owner approval ff2814e4; no automatic activation.\n' +
    replace(
      fs.readFileSync(
        'packages/database/proposals/economy-qa-002.sql.in',
        'utf8',
      ),
    ),
);
