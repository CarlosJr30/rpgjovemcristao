SET LOCAL equipment014.target_project='wspafhlbtlpabypzymjo';
-- Installs the approved individual recognition support. NEVER issues recognition.
-- Render a separate reviewed environment package; no blind db push.
SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='45s';
DO $$ BEGIN
 IF current_user<>'postgres' OR current_setting('equipment014.target_project',true) IS DISTINCT FROM 'wspafhlbtlpabypzymjo'
 OR public.release_scope()<>'guild-ebd-001' OR public.economy_protocol_version()<>3
 OR to_regprocedure('shop_private.reconciliation_snapshot_010(uuid)') IS NULL
 OR md5(replace(pg_get_functiondef('shop_private.equipment_origin_014(uuid,uuid,text)'::regprocedure),E'\r\n',E'\n'))<>'3f2f2ad0f816e2c5bbf6a6d79fdeb109'
 OR (SELECT proacl::text FROM pg_proc WHERE oid='shop_private.equipment_origin_014(uuid,uuid,text)'::regprocedure)<>'{postgres=X/postgres}'
 OR (SELECT md5(pg_get_constraintdef(oid)) FROM pg_constraint WHERE conrelid='public.chest_operations'::regclass AND conname='chest_operations_type_check')<>'2b49858bb3f2fa73f6ef8bf154a86bfe'
 OR to_regprocedure('shop_private.recognize_equipment_014(uuid,uuid,text)') IS NOT NULL
 THEN RAISE EXCEPTION 'Reviewed individual recognition environment required' USING ERRCODE='42501'; END IF;
END $$;

CREATE FUNCTION shop_private.recognition_manifest_014() RETURNS jsonb
LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT '{"contract":"RPG-EQUIPMENT-FIX-014:v1","approvalRef":"OWNER-APPROVED-2026-11-10:FIX-014","actor":"31b70059-deca-44c8-a6df-f21ea68b6e42","owner":"78729453-8e04-478c-96ae-d37cead1bc8c","financialApproval":{"id":"b1b1ffdf-74ab-4193-ad6c-7e43458ecff8","rowMD5":"bf4b640be59b60b2529ccec33f7cdc5a"},"items":[{"itemId":"traveler-armor-uncommon","quantity":1,"inventoryRowMD5":"4351c195af1467990ff8aa636eba8873","legacyReceipts":[]},{"itemId":"traveler-shield-rare","quantity":1,"inventoryRowMD5":"6b0f5c42fa0dd855d2be181a03987236","legacyReceipts":[]},{"itemId":"traveler-helmet-rare","quantity":4,"inventoryRowMD5":"d5326c59560ac6ff921e7abc99a66269","legacyReceipts":[{"id":"3ad028c4-91d7-4a9f-971b-2a801ccdb930","rowMD5":"d3427c5c5c91320be26822c5f7bd2fe4"},{"id":"ad8cffa2-04db-45bc-8184-d54af45e82b1","rowMD5":"8ee2a407f2169eb1da41393261a2f80d"},{"id":"fdaf483b-47e1-40a3-a898-63595c07973f","rowMD5":"43c5b93b853007cf7203231f3fff784e"}]},{"itemId":"wisdom-amulet","quantity":6,"inventoryRowMD5":"42b6ac82209f42bf42ca86a46cf1e047","legacyReceipts":[{"id":"17a90eb7-002b-4667-b80a-9a56854479c6","rowMD5":"9388ec49456991402ef91515b87550a4"},{"id":"26863ba3-aaa3-4aa0-b5e5-6f36c307d8a4","rowMD5":"2417ad8bfa1ba14b1bc6b45abbcb546f"},{"id":"3431bec6-d016-4ce2-ad48-17909ed81f63","rowMD5":"15fa72e888e656f00cd49e541f6fcf15"},{"id":"5b796cd1-b746-4b24-a6df-386af255426c","rowMD5":"d8e6f9358ec5128f028a3d0bd8941240"},{"id":"b88dafac-aab3-499d-95ea-7a2bfce906ff","rowMD5":"bb387f8d34ea7a1472a44e1885a80171"}]}]}'::jsonb
$$;
REVOKE ALL ON FUNCTION shop_private.recognition_manifest_014() FROM PUBLIC,anon,authenticated,service_role;
DO $$ DECLARE m jsonb:=shop_private.recognition_manifest_014(); BEGIN
 IF m->>'contract' IS DISTINCT FROM 'RPG-EQUIPMENT-FIX-014:v1' OR m->>'approvalRef' IS DISTINCT FROM 'OWNER-APPROVED-2026-11-10:FIX-014'
 OR m->>'actor' IS DISTINCT FROM '31b70059-deca-44c8-a6df-f21ea68b6e42' OR m->>'owner' IS DISTINCT FROM '78729453-8e04-478c-96ae-d37cead1bc8c'
 OR jsonb_array_length(m->'items') IS DISTINCT FROM 4
 OR (SELECT jsonb_object_agg(x->>'itemId',(x->>'quantity')::int) FROM jsonb_array_elements(m->'items') x)
 IS DISTINCT FROM '{"traveler-armor-uncommon":1,"traveler-shield-rare":1,"traveler-helmet-rare":4,"wisdom-amulet":6}'::jsonb
 THEN RAISE EXCEPTION 'Only the four individually approved items are allowed' USING ERRCODE='42501'; END IF;
END $$;

-- Extend only the existing audit ledger; monetary authority does not count this type.
DO $$ DECLARE prior text; BEGIN
 SELECT pg_get_constraintdef(oid) INTO prior FROM pg_constraint WHERE conrelid='public.chest_operations'::regclass AND conname='chest_operations_type_check';
 ALTER TABLE public.chest_operations DROP CONSTRAINT chest_operations_type_check;
 EXECUTE 'ALTER TABLE public.chest_operations ADD CONSTRAINT chest_operations_type_check CHECK (('||substring(prior FROM 8 FOR char_length(prior)-8)||') OR (operation_type=''equipment-recognition'' AND chest_type IS NULL AND account_id IS NOT NULL AND price_paid IS NULL AND source=''legacy-equipment-014'' AND rewards->>''contract''=''RPG-EQUIPMENT-FIX-014:v1''))';
END $$;

-- Fixed projection: future unrelated ledger columns must not invalidate evidence.
CREATE FUNCTION shop_private.receipt_hash_014(p_receipt public.chest_operations) RETURNS text
LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path='' SET timezone='UTC' AS $$
 SELECT md5(jsonb_build_object('id',(p_receipt).id,'traveler_id',(p_receipt).traveler_id,
  'account_id',(p_receipt).account_id,'identity_key',(p_receipt).identity_key,'operation_key',(p_receipt).operation_key,
  'operation_type',(p_receipt).operation_type,'chest_type',(p_receipt).chest_type,'source',(p_receipt).source,
  'price_paid',(p_receipt).price_paid,'rewards',(p_receipt).rewards,'created_at',(p_receipt).created_at)::text)
$$;
REVOKE ALL ON FUNCTION shop_private.receipt_hash_014(public.chest_operations) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION shop_private.protect_equipment_recognition_014() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE m jsonb; item jsonb; expected jsonb;
BEGIN
 IF TG_OP<>'INSERT' AND OLD.operation_type='equipment-recognition' THEN RAISE EXCEPTION 'Equipment recognition audit is append only' USING ERRCODE='42501'; END IF;
 IF TG_OP<>'DELETE' AND NEW.operation_type='equipment-recognition' THEN
  m:=shop_private.recognition_manifest_014();
  SELECT x INTO item FROM jsonb_array_elements(m->'items') x WHERE x->>'itemId'=NEW.rewards->>'itemId';
  IF current_user<>'postgres' OR TG_OP<>'INSERT' OR item IS NULL
  OR NEW.traveler_id IS DISTINCT FROM (m->>'actor')::uuid OR NEW.account_id IS DISTINCT FROM (m->>'owner')::uuid
  OR NEW.source<>'legacy-equipment-014' OR NEW.chest_type IS NOT NULL OR NEW.price_paid IS NOT NULL
  OR NEW.created_at IS DISTINCT FROM transaction_timestamp()
  OR NEW.identity_key IS DISTINCT FROM 'equipment014:'||(m->>'actor')||':'||(item->>'itemId')
  OR coalesce(NEW.rewards->>'snapshot','')!~'^[0-9a-f]{32}$'
  OR coalesce(NEW.rewards->>'operationId','')!~'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  OR NEW.operation_key IS DISTINCT FROM 'recognize-equipment:'||(NEW.rewards->>'operationId')||':'||(item->>'itemId')
  THEN RAISE EXCEPTION 'Approved individual equipment audit required' USING ERRCODE='42501'; END IF;
  expected:=jsonb_build_object('contract',m->>'contract','approvalRef',m->>'approvalRef','basis','administrative-owner-ratification',
   'itemId',item->>'itemId','quantity',item->'quantity','snapshot',NEW.rewards->>'snapshot','operationId',NEW.rewards->>'operationId',
   'newItemsGranted',0,'coins',0,'xp',0,'evidence',item);
  IF NEW.rewards IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Recognition payload differs from approval' USING ERRCODE='42501'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION shop_private.protect_equipment_recognition_014() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER protect_equipment_recognition_014 BEFORE INSERT OR UPDATE OR DELETE ON public.chest_operations
FOR EACH ROW EXECUTE FUNCTION shop_private.protect_equipment_recognition_014();

CREATE FUNCTION shop_private.recognition_valid_014(p_owner uuid,p_actor uuid,p_item text) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT EXISTS(
 SELECT 1 FROM jsonb_array_elements(shop_private.recognition_manifest_014()->'items') item
 CROSS JOIN LATERAL(SELECT shop_private.recognition_manifest_014() m) s
 JOIN public.chest_operations r ON r.traveler_id=p_actor AND r.account_id=p_owner
  AND r.operation_type='equipment-recognition' AND r.source='legacy-equipment-014'
  AND r.identity_key='equipment014:'||p_actor||':'||p_item
 WHERE p_actor=(m->>'actor')::uuid AND p_owner=(m->>'owner')::uuid AND item->>'itemId'=p_item
  AND r.rewards->>'contract'=m->>'contract' AND r.rewards->>'approvalRef'=m->>'approvalRef'
  AND r.rewards->'evidence'=item AND r.rewards->'quantity'=item->'quantity'
  AND r.rewards->>'newItemsGranted'='0' AND r.rewards->>'coins'='0' AND r.rewards->>'xp'='0'
  AND EXISTS(SELECT 1 FROM public.chest_operations f WHERE f.id=(m->'financialApproval'->>'id')::uuid
   AND f.traveler_id=p_actor AND f.account_id=p_owner AND f.source='legacy-admin-010'
   AND f.operation_type='administrative-reconciliation' AND shop_private.receipt_hash_014(f)=m->'financialApproval'->>'rowMD5')
  AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(item->'legacyReceipts') ref WHERE NOT EXISTS(
   SELECT 1 FROM public.chest_operations old WHERE old.id=(ref->>'id')::uuid AND old.traveler_id=p_actor
    AND old.source='task-0076-admin-test-profile' AND old.operation_type='open' AND old.rewards->>'itemId'=p_item
    AND shop_private.receipt_hash_014(old)=ref->>'rowMD5'))
 )
$$;
REVOKE ALL ON FUNCTION shop_private.recognition_valid_014(uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION shop_private.recognize_equipment_014(p_actor uuid,p_operation uuid,p_snapshot text) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' SET timezone='UTC' AS $$
DECLARE m jsonb:=shop_private.recognition_manifest_014(); who uuid:=(m->>'owner')::uuid; item jsonb; prior_count integer;
BEGIN
 IF current_user<>'postgres' OR p_actor IS DISTINCT FROM (m->>'actor')::uuid OR p_operation IS NULL
 OR current_setting('equipment014.target_project',true) IS DISTINCT FROM 'wspafhlbtlpabypzymjo'
 OR current_setting('equipment014.approval',true) IS DISTINCT FROM (m->>'approvalRef')
 OR public.release_scope()<>'guild-ebd-001' OR coalesce(p_snapshot,'')!~'^[0-9a-f]{32}$'
 THEN RAISE EXCEPTION 'Private individually approved recognition required' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(1010,1);
 PERFORM 1 FROM auth.users WHERE id=who AND email_confirmed_at IS NOT NULL AND NOT coalesce(is_anonymous,false)
  AND deleted_at IS NULL AND(banned_until IS NULL OR banned_until<=clock_timestamp()) FOR UPDATE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM auth.sessions WHERE user_id=who AND(not_after IS NULL OR not_after>clock_timestamp()))
 THEN RAISE EXCEPTION 'Existing confirmed normal session required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.travelers WHERE id=p_actor AND user_id=who AND is_active AND economic_verified_at IS NOT NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Approved active owner/avatar required' USING ERRCODE='42501'; END IF;
 SELECT count(*) INTO prior_count FROM public.chest_operations WHERE traveler_id=p_actor AND operation_type='equipment-recognition';
 IF prior_count>0 THEN
  IF prior_count<>4 OR EXISTS(SELECT 1 FROM public.chest_operations WHERE traveler_id=p_actor AND operation_type='equipment-recognition'
   AND(account_id IS DISTINCT FROM who OR rewards->>'operationId' IS DISTINCT FROM p_operation::text OR rewards->>'snapshot' IS DISTINCT FROM p_snapshot
    OR rewards->>'approvalRef' IS DISTINCT FROM (m->>'approvalRef')))
  THEN RAISE EXCEPTION 'Recognition identity conflict' USING ERRCODE='PT409'; END IF;
  RETURN (SELECT jsonb_agg(id ORDER BY id) FROM public.chest_operations WHERE traveler_id=p_actor AND operation_type='equipment-recognition');
 END IF;
 -- Reuse the published reconciliation snapshot and account -> avatar -> data lock order.
 PERFORM 1 FROM public.wallets WHERE traveler_id=p_actor FOR UPDATE;
 PERFORM 1 FROM public.traveler_stats WHERE traveler_id=p_actor FOR UPDATE;
 PERFORM 1 FROM public.inventory WHERE traveler_id=p_actor ORDER BY id FOR UPDATE;
 PERFORM 1 FROM public.equipped_items WHERE traveler_id=p_actor ORDER BY slot FOR UPDATE;
 PERFORM 1 FROM public.traveler_chests WHERE traveler_id=p_actor ORDER BY chest_type FOR UPDATE;
 PERFORM 1 FROM public.chest_operations WHERE traveler_id=p_actor ORDER BY id FOR UPDATE;
 PERFORM 1 FROM economy_qa_private.profiles WHERE traveler_id=p_actor FOR UPDATE;
 PERFORM 1 FROM economy_qa_private.receipts WHERE traveler_id=p_actor ORDER BY id FOR UPDATE;
 IF shop_private.reconciliation_snapshot_010(p_actor) IS DISTINCT FROM p_snapshot
 OR NOT EXISTS(SELECT 1 FROM public.chest_operations f WHERE f.id=(m->'financialApproval'->>'id')::uuid AND f.traveler_id=p_actor AND f.account_id=who
  AND f.operation_type='administrative-reconciliation' AND f.source='legacy-admin-010' AND shop_private.receipt_hash_014(f)=m->'financialApproval'->>'rowMD5')
 THEN RAISE EXCEPTION 'Approved snapshot changed; no recognition applied' USING ERRCODE='PT409'; END IF;
 FOR item IN SELECT x FROM jsonb_array_elements(m->'items') x LOOP
  IF NOT EXISTS(SELECT 1 FROM public.inventory i WHERE i.traveler_id=p_actor AND i.item_id=item->>'itemId'
   AND i.quantity=(item->>'quantity')::int AND i.card_receipt_id IS NULL AND md5(to_jsonb(i)::text)=item->>'inventoryRowMD5')
  OR EXISTS(SELECT 1 FROM jsonb_array_elements(item->'legacyReceipts') ref WHERE NOT EXISTS(
   SELECT 1 FROM public.chest_operations old WHERE old.id=(ref->>'id')::uuid AND old.traveler_id=p_actor
    AND old.source='task-0076-admin-test-profile' AND old.operation_type='open' AND old.rewards->>'itemId'=item->>'itemId'
    AND shop_private.receipt_hash_014(old)=ref->>'rowMD5'))
  THEN RAISE EXCEPTION 'Approved item evidence changed; no recognition applied' USING ERRCODE='PT409'; END IF;
 END LOOP;
 FOR item IN SELECT x FROM jsonb_array_elements(m->'items') x LOOP
  INSERT INTO public.chest_operations(traveler_id,account_id,identity_key,operation_key,operation_type,chest_type,source,price_paid,rewards)
  VALUES(p_actor,who,'equipment014:'||p_actor||':'||(item->>'itemId'),'recognize-equipment:'||p_operation||':'||(item->>'itemId'),
   'equipment-recognition',NULL,'legacy-equipment-014',NULL,jsonb_build_object('contract',m->>'contract','approvalRef',m->>'approvalRef',
    'basis','administrative-owner-ratification','itemId',item->>'itemId','quantity',item->'quantity','snapshot',p_snapshot,'operationId',p_operation,
    'newItemsGranted',0,'coins',0,'xp',0,'evidence',item));
 END LOOP;
 RETURN (SELECT jsonb_agg(id ORDER BY id) FROM public.chest_operations WHERE traveler_id=p_actor AND operation_type='equipment-recognition');
END $$;
REVOKE ALL ON FUNCTION shop_private.recognize_equipment_014(uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;

-- Extend only the shared origin predicate; all normal official receipts remain required.
CREATE OR REPLACE FUNCTION shop_private.equipment_origin_014(p_owner uuid,p_actor uuid,p_item text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF p_item IS NULL OR p_item NOT IN(
   'traveler-boots','traveler-helmet-rare','wisdom-amulet','traveler-sword-common','traveler-armor-uncommon','traveler-shield-rare',
   'equipment-apprentice-sword','equipment-pilgrim-blade','equipment-guardian-sword','equipment-courage-blade','equipment-perseverance-sword','equipment-victory-blade',
   'equipment-reinforced-tunic','equipment-traveler-vest','equipment-vigilance-cuirass','equipment-guardian-armor','equipment-perseverance-armor','equipment-fortress-armor',
   'equipment-wooden-shield','equipment-apprentice-shield','equipment-vigilance-shield','equipment-pilgrim-shield','equipment-courage-shield','equipment-fortress-shield',
   'equipment-leather-helmet','equipment-journey-helmet','equipment-vigilance-helmet','equipment-guardian-helmet','equipment-perseverance-helmet',
   'equipment-reinforced-sandals','equipment-explorer-boots','equipment-journey-boots','equipment-pilgrim-boots','equipment-perseverance-boots',
   'equipment-simple-pendant','equipment-journey-medal','equipment-prudence-amulet','equipment-vigilance-medallion','equipment-guardian-medallion','equipment-perseverance-medallion'
 ) THEN RETURN 'catalog-unavailable'; END IF;
 IF p_item<>'traveler-boots' AND NOT EXISTS(
   SELECT 1 FROM public.chest_operations
   WHERE account_id=p_owner AND traveler_id=p_actor AND rewards->>'itemId'=p_item
    AND((operation_type='open' AND source LIKE 'community001c:%')
     OR(operation_type IN('open','equipment-purchase') AND source LIKE 'shop001c:%'
       AND rewards->>'catalogVersion'='ECONOMY-001C:shop:v1'))
  ) AND NOT (
   p_item IN('wisdom-amulet','traveler-helmet-rare') AND EXISTS(
    SELECT 1 FROM economy_private.journey_rewards j
    JOIN public.inventory i ON i.traveler_id=j.traveler_id
    WHERE j.traveler_id=p_actor
     AND j.reward_key=CASE p_item WHEN 'wisdom-amulet' THEN 'phase:garden-choice' ELSE 'garden-equipment' END
     AND i.item_id=p_item AND i.quantity>0 AND i.card_receipt_id IS NULL
     AND i.metadata->>'source'=j.reward_key
   )
  ) THEN
  IF shop_private.recognition_valid_014(p_owner,p_actor,p_item) THEN RETURN NULL; END IF;
  RETURN 'acquisition-unconfirmed';
 END IF;
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION shop_private.equipment_origin_014(uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;

