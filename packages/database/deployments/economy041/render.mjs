import fs from 'node:fs';
import { createHash } from 'node:crypto';

const normalize = (s) => s.replaceAll('\r\n', '\n');
const md5 = (s) => createHash('md5').update(normalize(s)).digest('hex');
const literal = (s) => "'" + s.replaceAll("'", "''") + "'";
const read = (p) => fs.readFileSync(p, 'utf8');
export function renderEconomy041({ functions, constraints, project, scope }) {
  if (
    {
      wkdvdzfkbwvhyjmamrsg: 'hero-equipment-006',
      wspafhlbtlpabypzymjo: 'guild-ebd-001',
    }[project] !== scope
  )
    throw Error('Explicit reviewed project/scope required');
  const signatures = [
    'shop_private.purchase(uuid,text,text,uuid)',
    'shop_private.open(uuid,text,uuid)',
    'shop_private.coin_balance(uuid)',
    'shop_private.state(uuid)',
    'shop_private.equipment_origin_014(uuid,uuid,text)',
    'economy_private.collection(uuid,uuid)',
    'guild_activity_private.command(uuid,uuid,text,uuid,uuid,integer,jsonb)',
    'guild_activity_private.workspace(uuid,uuid,integer)',
  ];
  const originals = signatures.map((signature) => {
    const f = functions.find((f) => f.signature === signature);
    if (!f?.definition || !f.acl)
      throw Error('Missing prior function ' + signature);
    return { ...f, definition: normalize(f.definition) };
  });
  const guarded = [
    ...originals,
    ...[
      'shop_private.actor(uuid)',
      'shop_private.equip(uuid,text,text,text)',
      'shop_private.owned_equipment(uuid,text,text,text)',
    ].map((signature) => {
      const f = functions.find((f) => f.signature === signature);
      if (!f?.definition || !f.acl)
        throw Error('Missing preserved equipment/session authority');
      return { ...f, definition: normalize(f.definition) };
    }),
  ];
  const ledger = constraints.find(
    (c) => c.name === 'chest_operations_type_check',
  );
  const inv = constraints.find((c) => c.name === 'inventory_card_provenance');
  if (!ledger || !inv) throw Error('Reviewed constraints required');
  const oldCheck = ledger.def.replace(/^CHECK \(/, '').slice(0, -1);
  const cards = JSON.parse(
    read('packages/database/deployments/content040/catalog.json'),
  );
  const equipment = JSON.parse(
    read('packages/database/deployments/content040/equipment.json'),
  );
  for (const [items, counts] of [
    [cards, [3, 10, 9, 7, 4]],
    [equipment, [8, 9, 7, 7, 3]],
  ])
    ['comum', 'incomum', 'raro', 'épico', 'lendário'].forEach((r, i) => {
      if (items.filter((v) => v.rarity === r).length !== counts[i])
        throw Error('Approved pool count mismatch: ' + r);
    });
  if (new Set([...cards, ...equipment].map((v) => v.id)).size !== 67)
    throw Error('Approved 67 unique IDs required');
  const pool = [
    ...cards.map((v) => ({ kind: 'card', v })),
    ...equipment.map((v) => ({ kind: 'equipment', v })),
  ];
  const seed = pool
    .map(({ kind, v }) => {
      const json = literal(JSON.stringify(v));
      return `INSERT INTO shop_private.content_041 VALUES(${literal(v.id)},${literal(kind)},${literal(v.rarity)},${literal(v.name)},${kind === 'card' ? literal(v.catalogVersion) : 'NULL'},md5(${json}::jsonb::text),${json}::jsonb);`;
    })
    .join('\n');
  const change = (source, before, after) => {
    if (!source.includes(before))
      throw Error(
        'Reviewed adaptation boundary missing: ' + before.slice(0, 80),
      );
    return source.replace(before, () => after);
  };
  const modified = originals.map((f) => {
    let d = f.definition;
    if (f.signature.startsWith('guild_activity_private.command(')) {
      d = change(
        d,
        "'accessDetails','futureCategory']",
        "'accessDetails','futureCategory','economyTier']",
      );
      d = change(
        d,
        " ELSIF p_action='state' THEN",
        ` IF p_data ? 'economyTier' THEN
 IF jsonb_typeof(p_data->'economyTier') IS DISTINCT FROM 'string' OR p_data->>'economyTier' NOT IN('none','normal','great','epic','extraordinary')
 OR(p_data->>'economyTier'<>'none' AND(v_kind<>'activity' OR v_future<>'none')) THEN RAISE EXCEPTION 'Choose a single approved reward policy' USING ERRCODE='22023';END IF;
 UPDATE public.guild_missions SET reward_tier=CASE WHEN p_data->>'economyTier'='none' THEN 'normal' ELSE p_data->>'economyTier' END,
 metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('economy041',jsonb_build_object('contract','economy041-chest-v1','tier',p_data->>'economyTier')) WHERE id=p_id;
 END IF;
 ELSIF p_action='state' THEN`,
      );
    }
    if (f.signature.startsWith('guild_activity_private.workspace(')) {
      d = change(
        d,
        "'futureCategory',d.future_category",
        "'economyTier',CASE WHEN m.metadata->'economy041'->>'contract'='economy041-chest-v1' THEN m.metadata->'economy041'->>'tier' ELSE 'none' END,'futureCategory',d.future_category",
      );
      d = change(
        d,
        "'approvedAt',gp.approved_at",
        "'rewardClaimed',gp.reward_claimed_at IS NOT NULL,'approvedAt',gp.approved_at",
      );
    }
    // Keep the published purchase RPC byte-for-byte compatible. Only the new
    // opt-in wrapper purchases version 041; stale clients retain their contract.
    if (f.signature.startsWith('shop_private.purchase('))
      d = change(
        d,
        'IF p_operation IS NULL OR p_kind IS NULL',
        `IF EXISTS(SELECT 1 FROM public.chest_operations WHERE identity_key='economy041:purchase:'||who||':'||p_operation) THEN RAISE EXCEPTION 'Purchase contract conflict' USING ERRCODE='22023';END IF;\n IF p_operation IS NULL OR p_kind IS NULL`,
      );
    if (f.signature.startsWith('shop_private.open('))
      d = change(
        d,
        'IF p_operation IS NULL OR p_type IS NULL',
        `IF EXISTS(SELECT 1 FROM public.chest_operations WHERE traveler_id=p_actor AND account_id=who AND (operation_key='open:'||p_operation OR operation_key='purchase:'||p_operation) AND source LIKE 'economy041:%')\n OR(EXISTS(SELECT 1 FROM public.traveler_chests stack041 CROSS JOIN LATERAL jsonb_array_elements_text(stack041.sources) s(value) WHERE stack041.traveler_id=p_actor AND stack041.chest_type=p_type AND s.value LIKE 'economy041:%')\n AND NOT EXISTS(SELECT 1 FROM public.traveler_chests WHERE traveler_id=p_actor AND chest_type=p_type AND sources->>0 LIKE 'community001c:%')\n AND NOT EXISTS(SELECT 1 FROM public.chest_operations WHERE traveler_id=p_actor AND operation_key='purchase:'||p_operation AND source LIKE 'shop001c:%')) THEN RETURN shop_private.open_041(p_actor,p_type,p_operation);END IF;\n IF p_operation IS NULL OR p_type IS NULL`,
      );
    if (f.signature.startsWith('shop_private.coin_balance('))
      d = change(
        d,
        'SELECT coalesce(sum(CASE',
        `SELECT (SELECT coalesce(sum(CASE WHEN operation_type='purchase' THEN -price_paid::bigint WHEN operation_type IN('open','duplicate-sale-041','grant') THEN (rewards->>'coins')::bigint ELSE 0 END),0) FROM public.chest_operations WHERE traveler_id=p_actor AND account_id=(SELECT user_id FROM public.travelers WHERE id=p_actor) AND source LIKE 'economy041:%' AND rewards->>'catalogVersion'='economy041-chest-v1') + coalesce(sum(CASE`,
      );
    if (f.signature.startsWith('shop_private.equipment_origin_014('))
      d = change(
        d,
        "IF p_item<>'traveler-boots'",
        `IF EXISTS(SELECT 1 FROM shop_private.content_041 c WHERE c.item_id=p_item AND c.kind='equipment') AND shop_private.quantity_041(p_owner,p_actor,p_item)>0 THEN RETURN NULL;END IF;\n IF p_item<>'traveler-boots'`,
      );
    if (f.signature.startsWith('shop_private.state(')) {
      d = change(
        d,
        "'catalogVersion','ECONOMY-001C:shop:v1','offers'",
        "'catalogVersion','ECONOMY-001C:shop:v1','expansionVersion',(SELECT contract FROM shop_private.policy_041 WHERE singleton AND enabled),'offers'",
      );
      const offers = /'offers',jsonb_build_array\(([\s\S]*?)\)\);/;
      if (!offers.test(d)) throw Error('Reviewed offers boundary missing');
      d = d.replace(offers, (_, oldOffers) => {
        const expanded = change(
          oldOffers,
          "jsonb_build_object('kind','chest','id','common','price',40),",
          "jsonb_build_object('kind','chest','id','common','price',40),jsonb_build_object('kind','chest','id','uncommon','price',80),jsonb_build_object('kind','chest','id','rare','price',150),jsonb_build_object('kind','chest','id','epic','price',250),jsonb_build_object('kind','chest','id','extraordinary','price',400),",
        );
        return `'offers',CASE WHEN EXISTS(SELECT 1 FROM shop_private.policy_041 WHERE singleton AND enabled) THEN jsonb_build_array(${expanded}) ELSE jsonb_build_array(${oldOffers}) END);`;
      });
    }
    if (f.signature.startsWith('economy_private.collection(')) {
      d = change(
        d,
        "AND r.operation_type='card-starter'",
        "AND(r.operation_type='card-starter' OR(r.operation_type='open' AND r.source LIKE 'economy041:%' AND r.rewards->>'catalogVersion'='economy041-chest-v1' AND r.rewards->>'itemKind'='card' AND r.rewards->>'itemId'=i.item_id))",
      );
      d = change(
        d,
        "'receiptId',r.id)",
        "'receiptId',r.id,'quantity',i.quantity)",
      );
      d = change(
        d,
        'AND i.quantity=1',
        "AND(i.quantity=1 OR(r.operation_type='open' AND i.quantity=shop_private.quantity_041(p_user,p_traveler,i.item_id)))",
      );
      d = change(
        d,
        "AND r.rewards->'cardIds' ? i.item_id",
        "AND((r.operation_type='card-starter' AND r.rewards->'cardIds' ? i.item_id) OR(r.operation_type='open' AND r.rewards->>'itemId'=i.item_id AND i.quantity=shop_private.quantity_041(p_user,p_traveler,i.item_id)))",
      );
    }
    return d;
  });
  const guard =
    `SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='60s';\nDO $$ BEGIN\n IF current_setting('economy041.target_project',true) IS DISTINCT FROM '${project}' OR public.release_scope()<>'${scope}' OR public.economy_protocol_version()<>3 OR to_regclass('shop_private.policy_041') IS NOT NULL THEN RAISE EXCEPTION 'Reviewed ECONOMY-041 scope required' USING ERRCODE='42501';END IF;\n` +
    guarded
      .map(
        (f) =>
          ` IF md5(replace(pg_get_functiondef(${literal(f.signature)}::regprocedure),E'\\r\\n',E'\\n'))<>${literal(md5(f.definition))} OR(SELECT proacl::text FROM pg_proc WHERE oid=${literal(f.signature)}::regprocedure) IS DISTINCT FROM ${literal(f.acl)} THEN RAISE EXCEPTION 'Prior authority changed: ${f.signature}' USING ERRCODE='42501';END IF;`,
      )
      .join('\n') +
    `\n IF(SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='public.chest_operations'::regclass AND conname='chest_operations_type_check') IS DISTINCT FROM ${literal(ledger.def)} OR(SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='public.inventory'::regclass AND conname='inventory_card_provenance') IS DISTINCT FROM ${literal(inv.def)} THEN RAISE EXCEPTION 'Prior inventory or ledger contract changed' USING ERRCODE='42501';END IF;\nEND $$;\n`;
  const template = normalize(
    read('packages/database/proposals/economy-041.sql.in'),
  );
  const sql =
    guard +
    template
      .replaceAll('{{TARGET_PROJECT}}', () => project)
      .replaceAll('{{RELEASE_SCOPE}}', () => scope)
      .replace('{{CONTENT_SEED}}', () => seed)
      .replace('{{OLD_LEDGER_CHECK}}', () => oldCheck)
      .replace('{{EXISTING_FUNCTIONS}}', () => modified.join(';\n') + ';');
  if (/\{\{[A-Z_]+\}\}/.test(sql))
    throw Error('Unresolved package placeholder');
  const recovery =
    `DO $$BEGIN IF EXISTS(SELECT 1 FROM public.chest_operations WHERE source LIKE 'economy041:%') OR EXISTS(SELECT 1 FROM public.inventory WHERE metadata->>'contract'='economy041-chest-v1') THEN RAISE EXCEPTION 'Dependent ECONOMY-041 activity exists; use containment, preserve receipts' USING ERRCODE='42501';END IF;END $$;\n` +
    originals.map((f) => f.definition).join(';\n') +
    ';' +
    `\nDROP TRIGGER receipt041_immutable ON public.chest_operations;\nDROP TRIGGER content041_immutable ON shop_private.content_041;DROP TRIGGER chest_policy041_immutable ON shop_private.chest_policy_041;\nDROP FUNCTION public.sell_repeated_item(uuid,text,uuid,integer);DROP FUNCTION shop_private.sell_041(uuid,text,uuid,integer);DROP FUNCTION shop_private.open_041(uuid,text,uuid);DROP FUNCTION shop_private.purchase_041(uuid,text,uuid);DROP FUNCTION shop_private.ready_041(uuid,uuid);DROP FUNCTION shop_private.pool_ready_041(text);DROP FUNCTION shop_private.rate_limit_041(uuid);DROP FUNCTION shop_private.quantity_041(uuid,uuid,text);DROP FUNCTION shop_private.random_index_041(integer);DROP FUNCTION shop_private.immutable_041();\nALTER TABLE public.inventory DROP CONSTRAINT inventory_card_provenance;ALTER TABLE public.inventory ADD CONSTRAINT inventory_card_provenance ${inv.def};\nALTER TABLE public.chest_operations DROP CONSTRAINT chest_operations_type_check;ALTER TABLE public.chest_operations ADD CONSTRAINT chest_operations_type_check ${ledger.def};\nDROP TABLE shop_private.content_041,shop_private.chest_policy_041,shop_private.policy_041;`;
  const recoveryComplete = recovery.replace(
    'DROP FUNCTION public.sell_repeated_item',
    'DROP FUNCTION public.purchase_expansion_chest(uuid,text,text,uuid);DROP FUNCTION shop_private.activate_041(text);DROP FUNCTION public.claim_progress_reward(uuid,text,text);DROP FUNCTION shop_private.reward_041(uuid,text,text);DROP FUNCTION public.get_repeated_item_access(uuid,text);DROP FUNCTION shop_private.resale_state_041(uuid,text);DROP TRIGGER reward_policy041_immutable ON shop_private.reward_policy_041;DROP TABLE shop_private.reward_policy_041;\nDROP FUNCTION public.sell_repeated_item',
  );
  return {
    sql,
    recovery:
      `DO $$BEGIN IF current_setting('economy041.target_project',true) IS DISTINCT FROM '${project}' OR public.release_scope()<>'${scope}' THEN RAISE EXCEPTION 'Reviewed recovery target required' USING ERRCODE='42501';END IF;END $$;\n` +
      recoveryComplete,
    containment:
      'UPDATE shop_private.policy_041 SET enabled=false WHERE singleton; -- Preserve all receipts, possessions, balances and historical authorities.',
    fingerprints: guarded.map((f) => ({
      signature: f.signature,
      md5: md5(f.definition),
      acl: f.acl,
    })),
  };
}
