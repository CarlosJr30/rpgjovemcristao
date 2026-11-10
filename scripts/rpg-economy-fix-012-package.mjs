import fs from 'node:fs';
import path from 'node:path';
const [env, file] = process.argv.slice(2);
if (
  !['test', 'production'].includes(env) ||
  !file?.match(
    /^supabase\/migrations\/\d+_rpg_economy_fix_012_initialization_(test|production)\.sql$/,
  ) ||
  !file.endsWith('_' + env + '.sql') ||
  !fs.existsSync(file)
)
  throw Error('Matching CLI-created migration required');
const values =
  env === 'test'
    ? {
        PROJECT: 'wkdvdzfkbwvhyjmamrsg',
        SCOPE: 'hero-equipment-006',
        STATE_HASH: '2dc5521751448269c4264b8d40fcc8a2',
        CONSTRAINT_HASH: '4be9233df49add8809582ef8b7bf370e',
      }
    : {
        PROJECT: 'wspafhlbtlpabypzymjo',
        SCOPE: 'guild-ebd-001',
        STATE_HASH: '6b01d4fe6e306397ba5ccfa80b4e15bd',
        CONSTRAINT_HASH: '2b49858bb3f2fa73f6ef8bf154a86bfe',
      };
const source = fs.readFileSync(
  'packages/database/proposals/rpg-economy-fix-012.sql.in',
  'utf8',
);
const compile = (s) =>
  s.replace(
    /__(PROJECT|SCOPE|STATE_HASH|CONSTRAINT_HASH)__/g,
    (_, k) => values[k],
  );
fs.writeFileSync(file, compile(source));
const dir = 'packages/database/deployments/economyfix012';
const guard = compile(
  "DO $$ BEGIN IF current_setting('economyfix012.target_project',true) IS DISTINCT FROM '__PROJECT__' OR public.release_scope()<>'__SCOPE__' THEN RAISE EXCEPTION 'Correct recovery target required' USING ERRCODE='42501';END IF;END $$;\n",
);
fs.writeFileSync(
  path.join(dir, env + '-recovery-empty.sql'),
  guard +
    "DO $$BEGIN IF EXISTS(SELECT 1 FROM public.chest_operations WHERE operation_type='economic-initialization') THEN RAISE EXCEPTION 'Issued initialization requires preserving containment' USING ERRCODE='42501';END IF;END $$;\n" +
    fs.readFileSync(path.join(dir, 'prior-state-' + env + '.sql'), 'utf8') +
    ';\nDROP TRIGGER protect_initialization_012 ON public.chest_operations;\nDROP FUNCTION public.initialize_shop_economy(uuid),shop_private.initialize_012(uuid),shop_private.protect_initialization_012(),shop_private.pristine_012(uuid);\nALTER TABLE public.chest_operations DROP CONSTRAINT chest_operations_type_check;\n' +
    fs.readFileSync(path.join(dir, 'prior-constraint-' + env + '.sql'), 'utf8'),
);
fs.writeFileSync(
  path.join(dir, env + '-containment.sql'),
  guard +
    'REVOKE ALL ON FUNCTION public.initialize_shop_economy(uuid),shop_private.initialize_012(uuid) FROM PUBLIC,anon,authenticated,service_role;\n-- Existing verified avatars, audits, marker and balances remain intact.\n',
);
fs.writeFileSync(
  path.join(dir, env + '-files.json'),
  JSON.stringify(
    {
      project: values.PROJECT,
      scope: values.SCOPE,
      migration: file,
      recovery: dir + '/' + env + '-recovery-empty.sql',
      containment: dir + '/' + env + '-containment.sql',
      activation:
        'Explicit own-avatar request only; migration never initializes avatars',
    },
    null,
    2,
  ) + '\n',
);
