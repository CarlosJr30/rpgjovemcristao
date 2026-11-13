import fs from 'node:fs';
import { createHash } from 'node:crypto';
const normalize = (s) => s.replaceAll('\r\n', '\n');
const md5 = (s) => createHash('md5').update(normalize(s)).digest('hex');
const literal = (s) => "'" + s.replaceAll("'", "''") + "'";
const reason =
  'ECONOMY041 funded TEST fixture; not earned resources; owner approved 2026-11-11';
export function renderFixture041({
  owner,
  actor,
  balance,
  functions,
  constraints,
}) {
  if (![owner, actor].every((v) => /^[a-f0-9-]{36}$/.test(v)))
    throw Error('Reviewed TEST identity required');
  const budget = [
    'shop_qa_private.fund_fixture_014(uuid,uuid,uuid,text)',
    'shop_qa_private.grant_budget(uuid,uuid,text,uuid)',
  ].map((signature) => {
    const f = functions.find((f) => f.signature === signature);
    if (!f?.acl || !f.definition.includes('WHERE account_id=p_owner;'))
      throw Error('Prior budget boundary missing');
    return { ...f, definition: normalize(f.definition) };
  });
  if (!balance.definition.includes('SELECT ') || !balance.acl)
    throw Error('Prior balance required');
  const prior = normalize(balance.definition);
  const modified = prior.replace(
    'SELECT ',
    () => 'SELECT shop_qa_private.fixture_credit_041(p_actor) + ',
  );
  const values = {
    OWNER: owner,
    ACTOR: actor,
    BALANCE_MD5: md5(prior),
    BALANCE_DEFINITION: modified + ';',
    PRIOR_BUDGET_FUNCTIONS: budget
      .map(
        (f) =>
          f.definition.replace(
            'WHERE account_id=p_owner;',
            () => `WHERE account_id=p_owner AND reason<>${literal(reason)};`,
          ) + ';',
      )
      .join('\n'),
    PRIOR_GUARDS:
      [...budget, balance]
        .map(
          (f) =>
            `IF md5(replace(pg_get_functiondef(${literal(f.signature)}::regprocedure),E'\\r\\n',E'\\n'))<>${literal(md5(f.definition))} OR(SELECT proacl::text FROM pg_proc WHERE oid=${literal(f.signature)}::regprocedure) IS DISTINCT FROM ${literal(f.acl)} THEN RAISE EXCEPTION 'Prior TEST fixture authority changed' USING ERRCODE='42501';END IF;`,
        )
        .join('\n') +
      '\n' +
      constraints
        .map(
          (c) =>
            `IF(SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='shop_qa_private.budget_receipts'::regclass AND conname=${literal(c.name)}) IS DISTINCT FROM ${literal(c.def)} THEN RAISE EXCEPTION 'Prior TEST budget changed' USING ERRCODE='42501';END IF;`,
        )
        .join('\n'),
    OLD_AMOUNT_CHECK: constraints
      .find((c) => c.name === 'budget_receipts_amount_check')
      .def.replace(/^CHECK \(/, '')
      .slice(0, -1),
  };
  const sql = normalize(
    fs.readFileSync(
      'packages/database/proposals/economy-041-fixture-test.sql.in',
      'utf8',
    ),
  ).replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key) => {
    if (!(key in values)) throw Error('Unknown placeholder');
    return values[key];
  });
  const recovery = `DO $$BEGIN IF current_setting('economy041.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg' OR public.release_scope()<>'hero-equipment-006' OR EXISTS(SELECT 1 FROM shop_qa_private.budget_receipts WHERE reason=${literal(reason)}) THEN RAISE EXCEPTION 'Funded fixture must preserve audit and balance; empty TEST recovery only' USING ERRCODE='42501';END IF;END $$;\n${prior};\n${budget.map((f) => f.definition + ';').join('\n')}\nDROP FUNCTION shop_qa_private.fund_fixture_041(uuid,uuid,uuid,text);DROP FUNCTION shop_qa_private.fixture_credit_041(uuid);DROP TRIGGER budget041_immutable ON shop_qa_private.budget_receipts;DROP INDEX shop_qa_private.budget041_prior_account,shop_qa_private.budget041_prior_traveler,shop_qa_private.budget041_account,shop_qa_private.budget041_traveler;ALTER TABLE shop_qa_private.budget_receipts DROP CONSTRAINT budget_receipts_amount_check;\n${constraints.map((c) => `ALTER TABLE shop_qa_private.budget_receipts ADD CONSTRAINT ${c.name} ${c.def};`).join('\n')}`;
  return {
    sql,
    recovery,
    containment:
      'REVOKE ALL ON FUNCTION shop_qa_private.fund_fixture_041(uuid,uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role; -- Keep funded credit, immutable receipts and reconciliation intact.',
  };
}
