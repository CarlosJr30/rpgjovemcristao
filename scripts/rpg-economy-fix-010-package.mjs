import fs from 'node:fs';
import path from 'node:path';
const [env, file] = process.argv.slice(2);
if (
  !['test', 'production'].includes(env) ||
  !file?.match(
    /^supabase\/migrations\/\d+_rpg_economy_fix_010_reconciliation_(test|production)\.sql$/,
  ) ||
  !file.endsWith('_' + env + '.sql')
)
  throw Error('CLI-created matching migration required');
const values = {
  PROJECT: env === 'test' ? 'wkdvdzfkbwvhyjmamrsg' : 'wspafhlbtlpabypzymjo',
  SCOPE: env === 'test' ? 'hero-equipment-006' : 'guild-ebd-001',
  OWNER: '78729453-8e04-478c-96ae-d37cead1bc8c',
  ACTOR: '31b70059-deca-44c8-a6df-f21ea68b6e42',
};
values.CONSTRAINT =
  env === 'test'
    ? 'd0c77874e5e7609044b1591bfec6acf4'
    : '0530163d2e9c86c448a1260664d70256';
const compile = (s) =>
  s.replace(
    /__(PROJECT|SCOPE|OWNER|ACTOR|CONSTRAINT)__/g,
    (_, key) => values[key],
  );
const source = fs.readFileSync(
  'packages/database/proposals/rpg-economy-fix-010.sql.in',
  'utf8',
);
// Preserve the already-applied TEST migration; hardening has its own CLI-created revision.
const initial =
  env === 'test'
    ? source.replace(
        "IF current_user<>'postgres' OR TG_OP<>'INSERT' OR NEW.traveler_id",
        "IF TG_OP<>'INSERT' OR NEW.traveler_id",
      )
    : source;
fs.writeFileSync(
  file,
  '-- ' +
    env.toUpperCase() +
    ' ONLY. Installs support, never activates or grants.\n' +
    compile(initial),
);
const patchFile =
  'supabase/migrations/20261107124148_rpg_economy_fix_010_reconciliation_test_guard.sql';
if (env === 'test') {
  const fn = source
    .slice(
      source.indexOf(
        'CREATE FUNCTION shop_private.protect_reconciliation_010()',
      ),
      source.indexOf(
        'REVOKE ALL ON FUNCTION shop_private.protect_reconciliation_010()',
      ),
    )
    .replace('CREATE FUNCTION', 'CREATE OR REPLACE FUNCTION');
  fs.writeFileSync(
    patchFile,
    "-- TEST ONLY. Preserve applied history; restrict audit insertion to its existing operator.\nDO $$BEGIN IF current_setting('economyfix010.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg' OR md5(replace(pg_get_functiondef('shop_private.protect_reconciliation_010()'::regprocedure),E'\\r\\n',E'\\n'))<>'5b881b21003ac746da00484c6a1e0817' THEN RAISE EXCEPTION 'Reviewed TEST audit guard required' USING ERRCODE='42501';END IF;END $$;\n" +
      compile(fn),
  );
}
const prior = fs.readFileSync(
  env === 'test'
    ? 'supabase/migrations/20261103045300_economy_001c_shop_release_test.sql'
    : 'supabase/migrations/20261103045303_economy_001c_shop_release_production.sql',
  'utf8',
);
const start = prior.indexOf('CREATE FUNCTION shop_private.coin_balance('),
  end = prior.indexOf('CREATE FUNCTION shop_private.balance_valid(', start);
const balance = prior
  .slice(start, end)
  .replace('CREATE FUNCTION', 'CREATE OR REPLACE FUNCTION');
const cstart = prior.indexOf(
  'ALTER TABLE public.chest_operations ADD CONSTRAINT chest_operations_type_check CHECK(',
);
const constraint = prior.slice(cstart, prior.indexOf(';', cstart) + 1);
const dir = 'packages/database/deployments/economyfix010';
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(
  path.join(dir, env + '-recovery-empty.sql'),
  "DO $$BEGIN IF EXISTS(SELECT 1 FROM public.chest_operations WHERE operation_type='administrative-reconciliation') THEN RAISE EXCEPTION 'Issued baseline requires preserving containment' USING ERRCODE='42501';END IF;END $$;\nDROP TRIGGER protect_reconciliation_010 ON public.chest_operations;\nDROP FUNCTION shop_private.reconcile_legacy_010(uuid,uuid,text),shop_private.reconciliation_snapshot_010(uuid),shop_private.protect_reconciliation_010();\n" +
    balance +
    '\nALTER TABLE public.chest_operations DROP CONSTRAINT chest_operations_type_check;\n' +
    constraint +
    '\n',
);
fs.writeFileSync(
  path.join(dir, env + '-containment.sql'),
  compile(
    "-- Operator only. Preserve baseline/verification, wallet, XP, all receipts and QA.\nSELECT shop_private.hold('__OWNER__','__ACTOR__','49f672f3-7a2e-4732-855a-5f7bb2ee9f86','source-unavailable');\n",
  ),
);
fs.writeFileSync(
  path.join(dir, env + '-files.json'),
  JSON.stringify(
    {
      project: values.PROJECT,
      scope: values.SCOPE,
      migration: file,
      ...(env === 'test' ? { patch: patchFile } : {}),
      recovery: dir + '/' + env + '-recovery-empty.sql',
      containment: dir + '/' + env + '-containment.sql',
      activation:
        'PRIVATE-OWNER-ONLY; requires approved snapshot and normal session; never part of migration',
    },
    null,
    2,
  ) + '\n',
);
