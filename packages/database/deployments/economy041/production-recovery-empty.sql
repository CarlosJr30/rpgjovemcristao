DO $$BEGIN IF current_setting('economy041.target_project',true) IS DISTINCT FROM 'wspafhlbtlpabypzymjo' OR public.release_scope()<>'guild-ebd-001' THEN RAISE EXCEPTION 'Reviewed recovery target required' USING ERRCODE='42501';END IF;END $$;
DO $$BEGIN IF EXISTS(SELECT 1 FROM public.chest_operations WHERE source LIKE 'economy041:%') OR EXISTS(SELECT 1 FROM public.inventory WHERE metadata->>'contract'='economy041-chest-v1') THEN RAISE EXCEPTION 'Dependent ECONOMY-041 activity exists; use containment, preserve receipts' USING ERRCODE='42501';END IF;END $$;
CREATE OR REPLACE FUNCTION shop_private.purchase(p_actor uuid, p_kind text, p_offer text, p_operation uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE who uuid;prior public.chest_operations;answer jsonb;price integer;receipt uuid;k text;source_value text;BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);who:=shop_private.actor(p_actor);
 IF p_operation IS NULL OR p_kind IS NULL OR p_offer IS NULL OR NOT((p_kind='chest' AND p_offer='common') OR(p_kind='equipment' AND p_offer IN('traveler-sword-common','traveler-armor-uncommon','traveler-shield-rare'))) THEN RAISE EXCEPTION 'Reviewed offer required' USING ERRCODE='22023';END IF;
 k:='shop-purchase:v1:'||who||':'||p_operation;SELECT * INTO prior FROM public.chest_operations WHERE identity_key=k;
 IF FOUND THEN IF prior.traveler_id<>p_actor OR(p_kind='chest' AND(prior.operation_type<>'purchase' OR prior.chest_type<>p_offer)) OR(p_kind='equipment' AND(prior.operation_type<>'equipment-purchase' OR prior.rewards->>'itemId' IS DISTINCT FROM p_offer)) THEN RAISE EXCEPTION 'Purchase identity conflict' USING ERRCODE='22023';END IF;RETURN jsonb_build_object('version',1,'qaOnly',false,'receiptId',prior.id,'kind',p_kind,'offer',p_offer,'pricePaid',prior.price_paid,'replayed',true);END IF;
 IF NOT EXISTS(SELECT 1 FROM shop_private.policy WHERE singleton AND enabled) THEN RAISE EXCEPTION 'Shop disabled' USING ERRCODE='42501';END IF;
 PERFORM 1 FROM public.wallets WHERE traveler_id=p_actor FOR UPDATE;
 IF EXISTS(SELECT 1 FROM shop_private.holds WHERE account_id=who AND traveler_id=p_actor) OR NOT shop_private.balance_valid(p_actor) THEN RETURN shop_private.hold(who,p_actor,p_operation,'balance-inconsistent');END IF;
 IF p_kind='chest' THEN answer:=economy_private.purchase_chest(p_actor,'common',p_operation);price:=40;source_value:='shop001c:'||p_operation;
 UPDATE public.traveler_chests SET sources=jsonb_set(sources,ARRAY[(quantity-1)::text],to_jsonb(source_value),false) WHERE traveler_id=p_actor AND chest_type='common';
 UPDATE public.chest_operations SET account_id=who,identity_key=k,source=source_value,rewards=rewards||jsonb_build_object('catalogVersion','ECONOMY-001C:shop:v1') WHERE traveler_id=p_actor AND operation_key='purchase:'||p_operation RETURNING id INTO receipt;
 ELSE answer:=economy_private.base_authority(who,p_actor,'purchase',jsonb_build_object('itemId',p_offer));price:=CASE WHEN answer->>'status'='owned' THEN 0 ELSE CASE p_offer WHEN 'traveler-sword-common' THEN 35 WHEN 'traveler-armor-uncommon' THEN 65 WHEN 'traveler-shield-rare' THEN 115 END END;
 INSERT INTO public.chest_operations(traveler_id,account_id,identity_key,operation_key,operation_type,chest_type,source,price_paid,rewards) VALUES(p_actor,who,k,'equipment-purchase:'||p_operation,'equipment-purchase',NULL,'shop001c:equipment',price,jsonb_build_object('itemId',p_offer,'catalogVersion','ECONOMY-001C:shop:v1','status',answer->>'status')) RETURNING id INTO receipt;END IF;
 IF receipt IS NULL OR NOT shop_private.balance_valid(p_actor) THEN RAISE EXCEPTION 'Purchase reconciliation failed' USING ERRCODE='42501';END IF;
 RETURN jsonb_build_object('version',1,'qaOnly',false,'receiptId',receipt,'kind',p_kind,'offer',p_offer,'pricePaid',price,'replayed',false);END $function$
;
CREATE OR REPLACE FUNCTION shop_private.open(p_actor uuid, p_type text, p_operation uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE who uuid;prior public.chest_operations;c public.traveler_chests;answer jsonb;chosen text;position_index integer;remaining jsonb;wanted text;BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);who:=shop_private.actor(p_actor);
 IF p_operation IS NULL OR p_type IS NULL OR p_type NOT IN('common','epic') THEN RAISE EXCEPTION 'Reviewed opening required' USING ERRCODE='22023';END IF;
 SELECT * INTO prior FROM public.chest_operations WHERE traveler_id=p_actor AND operation_key='open:'||p_operation;
 IF FOUND THEN IF prior.account_id IS DISTINCT FROM who OR prior.chest_type<>p_type OR prior.operation_type<>'open' OR NOT(prior.source LIKE 'community001c:%' OR prior.source LIKE 'shop001c:%') THEN RAISE EXCEPTION 'Opening identity conflict' USING ERRCODE='22023';END IF;RETURN prior.rewards||jsonb_build_object('duplicate',true);END IF;
 IF NOT EXISTS(SELECT 1 FROM shop_private.policy WHERE singleton AND enabled) THEN RAISE EXCEPTION 'Shop disabled' USING ERRCODE='42501';END IF;
 SELECT * INTO c FROM public.traveler_chests WHERE traveler_id=p_actor AND chest_type=p_type AND quantity>0 FOR UPDATE;
 IF c.traveler_id IS NOT NULL AND c.sources->>0 LIKE 'community001c:%' AND NOT EXISTS(SELECT 1 FROM public.chest_operations WHERE traveler_id=p_actor AND account_id=who AND operation_key='purchase:'||p_operation AND operation_type='purchase' AND source='shop001c:'||p_operation) THEN RETURN economy_private.open_community_chest_001c(p_actor,p_type,p_operation);END IF;
 PERFORM 1 FROM public.wallets WHERE traveler_id=p_actor FOR UPDATE;
 IF EXISTS(SELECT 1 FROM shop_private.holds WHERE account_id=who AND traveler_id=p_actor) OR NOT shop_private.balance_valid(p_actor) THEN RETURN shop_private.hold(who,p_actor,p_operation,'balance-inconsistent');END IF;
 -- Select only an outstanding, unique source backed by this account's purchase.
 -- The existing opener consumes index zero; move the selected source inside the
 -- same transaction, retaining the relative order of every unconsumed source.
 IF p_type='common' AND c.traveler_id IS NOT NULL AND jsonb_array_length(c.sources)=c.quantity THEN
   SELECT source INTO wanted FROM public.chest_operations
    WHERE traveler_id=p_actor AND account_id=who AND operation_type='purchase'
     AND chest_type='common' AND operation_key='purchase:'||p_operation
     AND source='shop001c:'||p_operation AND price_paid=40
     AND rewards->>'catalogVersion'='ECONOMY-001C:shop:v1';
   SELECT e.value,e.ordinality::integer-1 INTO chosen,position_index
    FROM jsonb_array_elements_text(c.sources) WITH ORDINALITY e(value,ordinality)
    WHERE e.value LIKE 'shop001c:%' AND (wanted IS NULL OR e.value=wanted)
     AND (SELECT count(*) FROM jsonb_array_elements_text(c.sources) z(value) WHERE z.value=e.value)=1
     AND EXISTS(SELECT 1 FROM public.chest_operations r WHERE r.traveler_id=p_actor AND r.account_id=who
       AND r.operation_type='purchase' AND r.chest_type='common' AND r.source=e.value
       AND r.operation_key='purchase:'||substring(e.value from 10) AND r.price_paid=40
       AND r.rewards->>'catalogVersion'='ECONOMY-001C:shop:v1')
     AND NOT EXISTS(SELECT 1 FROM public.chest_operations r WHERE r.traveler_id=p_actor
       AND r.operation_type='open' AND r.source=e.value)
    ORDER BY e.ordinality LIMIT 1;
   IF wanted IS NOT NULL AND chosen IS NULL THEN RAISE EXCEPTION 'Purchase already consumed or source unavailable' USING ERRCODE='22023';END IF;
   IF position_index>0 THEN
     remaining:=c.sources-position_index;
     c.sources:=jsonb_build_array(chosen)||remaining;
     UPDATE public.traveler_chests SET sources=c.sources WHERE traveler_id=p_actor AND chest_type=p_type;
   END IF;
 END IF;
 IF chosen IS NULL OR p_type<>'common' OR c.traveler_id IS NULL OR jsonb_array_length(c.sources)<>c.quantity OR(c.sources->>0) NOT LIKE 'shop001c:%' OR NOT EXISTS(SELECT 1 FROM public.chest_operations WHERE traveler_id=p_actor AND account_id=who AND source=c.sources->>0 AND operation_type='purchase' AND chest_type='common' AND price_paid=40 AND rewards->>'catalogVersion'='ECONOMY-001C:shop:v1') THEN RAISE EXCEPTION 'Verified unopened purchase required' USING ERRCODE='42501';END IF;
 answer:=economy_private.open_chest(p_actor,'common',p_operation);
 IF((answer->>'coins'='25' AND answer->>'itemId' IS NULL) OR(answer->>'coins'='10' AND answer->>'itemId'='traveler-sword-common')) IS DISTINCT FROM true THEN RAISE EXCEPTION 'Reviewed common loot required' USING ERRCODE='42501';END IF;
 UPDATE public.chest_operations SET account_id=who,identity_key='shop-open:v1:'||who||':'||p_operation,rewards=rewards||jsonb_build_object('catalogVersion','ECONOMY-001C:shop:v1') WHERE traveler_id=p_actor AND operation_key='open:'||p_operation;
 IF NOT shop_private.balance_valid(p_actor) THEN RAISE EXCEPTION 'Opening reconciliation failed' USING ERRCODE='42501';END IF;RETURN answer;END $function$
;
CREATE OR REPLACE FUNCTION shop_private.coin_balance(p_actor uuid)
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT coalesce(sum(CASE WHEN operation_type='open' THEN (rewards->>'coins')::bigint
 WHEN operation_type IN('purchase','equipment-purchase') THEN -price_paid::bigint ELSE 0 END),0)
 +coalesce((SELECT (r.rewards->>'baselineCoins')::bigint FROM public.chest_operations r
 WHERE p_actor='31b70059-deca-44c8-a6df-f21ea68b6e42'::uuid AND r.traveler_id=p_actor AND r.account_id='78729453-8e04-478c-96ae-d37cead1bc8c'::uuid
 AND r.account_id=(SELECT user_id FROM public.travelers WHERE id=p_actor)
 AND r.operation_type='administrative-reconciliation' AND r.source='legacy-admin-010'
 AND r.identity_key='legacy-admin-010:31b70059-deca-44c8-a6df-f21ea68b6e42'
 AND r.rewards->>'contract'='RPG-ECONOMY-FIX-010:v1'
 AND r.rewards->>'approvalRef'='OWNER-APPROVED-2026-11-07'
 AND r.rewards->>'baselineCoins'='1006265'),0)
 FROM public.chest_operations WHERE traveler_id=p_actor AND account_id=(SELECT user_id FROM public.travelers WHERE id=p_actor)
 AND((operation_type='open' AND source LIKE 'community001c:%') OR(source LIKE 'shop001c:%' AND rewards->>'catalogVersion'='ECONOMY-001C:shop:v1'))
$function$
;
CREATE OR REPLACE FUNCTION shop_private.state(p_actor uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$DECLARE who uuid;reason text;BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);who:=economy_private.community_xp_actor(p_actor);
 IF public.release_scope()<>'guild-ebd-001' OR NOT EXISTS(SELECT 1 FROM shop_private.policy WHERE singleton AND enabled) THEN reason:='disabled';
 ELSIF NOT EXISTS(SELECT 1 FROM public.travelers WHERE id=p_actor AND economic_verified_at IS NOT NULL) THEN reason:='legacy-reconciliation-required';
 ELSIF EXISTS(SELECT 1 FROM public.chest_operations WHERE traveler_id=p_actor AND(source LIKE 'qa-shop001c%' OR coalesce((rewards->>'qaOnly')::boolean,false))) THEN reason:='qa-source';
 ELSIF EXISTS(SELECT 1 FROM shop_private.holds WHERE account_id=who AND traveler_id=p_actor) THEN reason:='suspended';
 ELSIF NOT shop_private.balance_valid(p_actor) THEN reason:='balance-inconsistent';END IF;
 RETURN jsonb_build_object('version',1,'qaOnly',false,'enabled',reason IS NULL,'reason',reason,'coins',(SELECT coins FROM public.wallets WHERE traveler_id=p_actor),'balanceVerified',reason IS NULL,'catalogVersion','ECONOMY-001C:shop:v1','offers',jsonb_build_array(
 jsonb_build_object('kind','chest','id','common','price',40),jsonb_build_object('kind','equipment','id','traveler-sword-common','price',35),jsonb_build_object('kind','equipment','id','traveler-armor-uncommon','price',65),jsonb_build_object('kind','equipment','id','traveler-shield-rare','price',115)));
END $function$
;
CREATE OR REPLACE FUNCTION shop_private.equipment_origin_014(p_owner uuid, p_actor uuid, p_item text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
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
END $function$
;
CREATE OR REPLACE FUNCTION economy_private.collection(p_user uuid, p_traveler uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT coalesce(jsonb_agg(jsonb_build_object('card',c.definition,'version',c.version,'receiptId',r.id) ORDER BY c.id),'[]')
 FROM public.inventory i JOIN public.travelers t ON t.id=i.traveler_id
 JOIN public.chest_operations r ON r.id=i.card_receipt_id AND r.traveler_id=t.id AND r.account_id=t.user_id AND r.operation_type='card-starter'
 JOIN economy_private.card_catalog c ON c.id=i.item_id AND c.version=i.card_version
 WHERE t.id=p_traveler AND t.user_id=p_user AND i.quantity=1 AND i.card_revoked_at IS NULL AND c.revoked_at IS NULL
 AND r.rewards->'cardIds' ? i.item_id;
$function$
;
CREATE OR REPLACE FUNCTION guild_activity_private.command(p_actor uuid, p_guild uuid, p_action text, p_id uuid, p_request uuid, p_revision integer, p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE owner_id uuid;own_role text;m public.guild_missions%ROWTYPE;d guild_activity_private.details%ROWTYPE;
 gp public.guild_mission_progress%ROWTYPE;old_cmd guild_activity_private.commands%ROWTYPE;
 old_delegate guild_activity_private.delegations%ROWTYPE;sig text;receipt jsonb;next_rev integer;target uuid;target_owner uuid;actor_name text;
 parent uuid;v_kind text;v_status text;v_category text;v_future text;v_expires timestamptz;v_start timestamptz;v_due timestamptz;v_targets uuid[];v_now timestamptz;previous_status text;
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(1010,1);PERFORM guild_admin_private.require_writes();own_role:=guild_activity_private.actor_role(p_actor,p_guild);owner_id:=auth.uid();v_now:=clock_timestamp();
 IF p_id IS NULL OR p_request IS NULL OR p_revision IS NULL OR p_revision<0 OR jsonb_typeof(p_data) IS DISTINCT FROM 'object' OR p_action IS NULL OR p_action NOT IN('save','state','delegate','participate','review') THEN RAISE EXCEPTION 'Invalid command' USING ERRCODE='22023';END IF;
 SELECT * INTO m FROM public.guild_missions WHERE id=p_id FOR UPDATE;
 IF m.id IS NOT NULL AND(m.guild_id<>p_guild OR m.community_protocol IS DISTINCT FROM 1) THEN RAISE EXCEPTION 'Activity unavailable' USING ERRCODE='42501';END IF;
 IF p_action IN('save','state','delegate') AND own_role<>'leader' OR p_action='review' AND(m.id IS NULL OR NOT guild_activity_private.can_validate(p_actor,p_id)) THEN RAISE EXCEPTION 'Current activity authorization required' USING ERRCODE='42501';END IF;
 IF p_action<>'save' AND m.id IS NULL THEN RAISE EXCEPTION 'Activity unavailable' USING ERRCODE='P0002';END IF;
 sig:=md5(jsonb_build_array(p_actor,p_guild,p_action,p_id,p_revision,p_data)::text);SELECT * INTO old_cmd FROM guild_activity_private.commands WHERE request_id=p_request;
 IF old_cmd.request_id IS NOT NULL THEN IF old_cmd.owner_id<>owner_id OR old_cmd.actor_id<>p_actor OR old_cmd.guild_id<>p_guild OR old_cmd.fingerprint<>sig THEN RAISE EXCEPTION 'Command conflict' USING ERRCODE='PT409';END IF;RETURN old_cmd.receipt||jsonb_build_object('replayed',true);END IF;
 SELECT * INTO d FROM guild_activity_private.details WHERE mission_id=p_id;
 IF p_action='save' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['title','description','objective','instructions','evidenceCriterion','bibleReference','startsAt','dueAt','audience','targetIds','kind','meetingId','category','theme','meetingType','responsibleId','accessDetails','futureCategory']);
 IF m.id IS NOT NULL AND(m.status<>'draft' OR m.workspace_revision<>p_revision) OR m.id IS NULL AND p_revision<>0 THEN RAISE EXCEPTION 'Activity conflict' USING ERRCODE='PT409';END IF;
 v_kind:=p_data->>'kind';v_category:=p_data->>'category';v_future:=p_data->>'futureCategory';
 IF v_kind IS NULL OR v_kind NOT IN('meeting','activity') OR v_category IS NULL OR v_category NOT IN('biblical_challenge','guided_reading','practical','gincana','solidarity','group','cooperative','competitive','special') OR v_future IS NULL OR v_future NOT IN('none','common','rare','epic')
 OR length(btrim(coalesce(p_data->>'title',''))) NOT BETWEEN 2 AND 100 OR length(btrim(coalesce(p_data->>'description',''))) NOT BETWEEN 1 AND 1000 OR length(btrim(coalesce(p_data->>'objective',''))) NOT BETWEEN 1 AND 500
 OR length(btrim(coalesce(p_data->>'instructions',''))) NOT BETWEEN 1 AND 1000 OR length(btrim(coalesce(p_data->>'evidenceCriterion',''))) NOT BETWEEN 1 AND 300 OR length(coalesce(p_data->>'bibleReference',''))>100 OR length(coalesce(p_data->>'theme',''))>100 OR length(coalesce(p_data->>'accessDetails',''))>600
 OR p_data->>'meetingType' IS NULL OR p_data->>'meetingType' NOT IN('in_person','digital') OR p_data->>'audience' IS NULL OR p_data->>'audience' NOT IN('all','selected') OR jsonb_typeof(p_data->'targetIds') IS DISTINCT FROM 'array' OR jsonb_array_length(p_data->'targetIds')>100 THEN RAISE EXCEPTION 'Invalid activity fields' USING ERRCODE='22023';END IF;
 v_start:=nullif(p_data->>'startsAt','')::timestamptz;v_due:=nullif(p_data->>'dueAt','')::timestamptz;
 IF v_kind='meeting' AND v_start IS NULL OR v_due<=v_start OR v_kind='activity' AND coalesce(p_data->>'accessDetails','')<>'' THEN RAISE EXCEPTION 'Invalid meeting date or access' USING ERRCODE='22023';END IF;
 IF v_kind='meeting' AND p_data->>'meetingType'='digital' AND coalesce(p_data->>'accessDetails','')<>'' AND(p_data->>'accessDetails' !~ '^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$' OR p_data->>'accessDetails'~'[[:cntrl:]]') THEN RAISE EXCEPTION 'HTTPS access link required' USING ERRCODE='22023';END IF;
 SELECT coalesce(array_agg(DISTINCT value::uuid),'{}') INTO v_targets FROM jsonb_array_elements_text(p_data->'targetIds');
 IF p_data->>'audience'='all' AND cardinality(v_targets)>0 OR p_data->>'audience'='selected' AND cardinality(v_targets)=0 OR EXISTS(SELECT 1 FROM unnest(v_targets) t WHERE NOT EXISTS(SELECT 1 FROM public.guild_members gm WHERE gm.guild_id=p_guild AND gm.traveler_id=t AND gm.status='active')) THEN RAISE EXCEPTION 'Invalid audience' USING ERRCODE='42501';END IF;
 target:=(p_data->>'responsibleId')::uuid;IF target IS NULL OR NOT EXISTS(SELECT 1 FROM public.guild_members WHERE guild_id=p_guild AND traveler_id=target AND status='active') THEN RAISE EXCEPTION 'Responsible must be an active member; validation requires explicit delegation' USING ERRCODE='42501';END IF;
 parent:=nullif(p_data->>'meetingId','')::uuid;IF parent IS NOT NULL AND(v_kind<>'activity' OR NOT EXISTS(SELECT 1 FROM public.guild_missions pm JOIN guild_activity_private.details pd ON pd.mission_id=pm.id WHERE pm.id=parent AND pm.guild_id=p_guild AND pm.community_protocol=1 AND pd.kind='meeting' AND pm.status IN('draft','published'))) THEN RAISE EXCEPTION 'Meeting unavailable' USING ERRCODE='42501';END IF;
 IF m.id IS NOT NULL AND d.kind<>v_kind THEN RAISE EXCEPTION 'Activity kind is fixed' USING ERRCODE='22023';END IF;
 next_rev:=coalesce(m.workspace_revision,0)+1;
 INSERT INTO public.guild_missions(id,guild_id,created_by_traveler_id,title,description,mission_type,completion_mode,requires_leader_approval,reward_tier,status,starts_at,due_at,objective,instructions,evidence_criterion,bible_reference,audience,target_traveler_ids,workspace_revision,community_protocol)
 VALUES(p_id,p_guild,p_actor,btrim(p_data->>'title'),p_data->>'description','practical_activity','leader_approval',true,'normal','draft',v_start,v_due,p_data->>'objective',p_data->>'instructions',p_data->>'evidenceCriterion',p_data->>'bibleReference',p_data->>'audience',v_targets,next_rev,1)
 ON CONFLICT(id) DO UPDATE SET title=excluded.title,description=excluded.description,starts_at=excluded.starts_at,due_at=excluded.due_at,objective=excluded.objective,instructions=excluded.instructions,evidence_criterion=excluded.evidence_criterion,bible_reference=excluded.bible_reference,audience=excluded.audience,target_traveler_ids=excluded.target_traveler_ids,workspace_revision=excluded.workspace_revision;
 INSERT INTO guild_activity_private.details VALUES(p_id,v_kind,parent,v_category,coalesce(p_data->>'theme',''),p_data->>'meetingType',target,coalesce(p_data->>'accessDetails',''),v_future)
 ON CONFLICT(mission_id) DO UPDATE SET meeting_id=excluded.meeting_id,category=excluded.category,theme=excluded.theme,meeting_type=excluded.meeting_type,responsible_id=excluded.responsible_id,access_details=excluded.access_details,future_category=excluded.future_category;
 ELSIF p_action='state' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['state']);v_status:=p_data->>'state';
 IF m.workspace_revision<>p_revision THEN RAISE EXCEPTION 'Activity conflict' USING ERRCODE='PT409';END IF;
 IF NOT(m.status='draft' AND v_status IN('published','cancelled') OR m.status='published' AND v_status IN('closed','cancelled')) THEN RAISE EXCEPTION 'Invalid activity transition' USING ERRCODE='22023';END IF;
 IF v_status='published' AND d.meeting_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.guild_missions WHERE id=d.meeting_id AND status='published') THEN RAISE EXCEPTION 'Publish parent meeting first' USING ERRCODE='22023';END IF;
 IF v_status='closed' AND d.kind='meeting' AND EXISTS(SELECT 1 FROM guild_activity_private.details child JOIN public.guild_missions cm ON cm.id=child.mission_id WHERE child.meeting_id=p_id AND cm.status NOT IN('closed','cancelled')) THEN RAISE EXCEPTION 'Close or cancel meeting activities first' USING ERRCODE='22023';END IF;
 previous_status:=m.status;
 UPDATE public.guild_missions SET status=v_status,workspace_revision=workspace_revision+1,published_at=CASE WHEN v_status='published' THEN v_now ELSE published_at END,closed_at=CASE WHEN v_status IN('closed','cancelled') THEN v_now ELSE closed_at END WHERE id=p_id;next_rev:=p_revision+1;
 IF v_status='cancelled' THEN UPDATE guild_activity_private.future_eligibility SET validated=false,updated_at=v_now WHERE mission_id=p_id OR mission_id IN(SELECT mission_id FROM guild_activity_private.details WHERE meeting_id=p_id);END IF;
 ELSIF p_action='delegate' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['travelerId','active','expiresAt']);target:=(p_data->>'travelerId')::uuid;v_expires:=(p_data->>'expiresAt')::timestamptz;
 IF jsonb_typeof(p_data->'active') IS DISTINCT FROM 'boolean' OR target IS NULL OR NOT EXISTS(SELECT 1 FROM public.guild_members WHERE guild_id=p_guild AND traveler_id=target AND status='active') OR (p_data->>'active')::boolean AND m.status NOT IN('draft','published') THEN RAISE EXCEPTION 'Invalid temporary validator' USING ERRCODE='42501';END IF;
 IF v_expires IS NULL OR (p_data->>'active')::boolean AND(v_expires<=v_now OR v_expires>v_now+interval '30 days') THEN RAISE EXCEPTION 'Temporary delegation requires a future expiry within30days' USING ERRCODE='22023';END IF;
 SELECT * INTO old_delegate FROM guild_activity_private.delegations WHERE mission_id=p_id AND traveler_id=target;
 IF coalesce(old_delegate.revision,0)<>p_revision THEN RAISE EXCEPTION 'Delegation conflict' USING ERRCODE='PT409';END IF;next_rev:=p_revision+1;
 INSERT INTO guild_activity_private.delegations VALUES(p_id,target,v_expires,(p_data->>'active')::boolean,next_rev,p_actor) ON CONFLICT(mission_id,traveler_id) DO UPDATE SET expires_at=excluded.expires_at,active=excluded.active,revision=excluded.revision,granted_by=excluded.granted_by;
 ELSIF p_action='participate' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['declared']);IF p_data->'declared' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'Participation declaration required; no personal text' USING ERRCODE='22023';END IF;
 IF m.status<>'published' OR m.audience='selected' AND NOT p_actor=ANY(m.target_traveler_ids) OR m.starts_at>v_now OR m.due_at<v_now OR d.meeting_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.guild_missions WHERE id=d.meeting_id AND status='published') THEN RAISE EXCEPTION 'Participation unavailable' USING ERRCODE='42501';END IF;
 SELECT * INTO gp FROM public.guild_mission_progress WHERE mission_id=p_id AND participant_uid=owner_id FOR UPDATE;
 IF gp.id IS NOT NULL AND gp.traveler_id<>p_actor THEN RAISE EXCEPTION 'Account already participating through another avatar' USING ERRCODE='PT409';END IF;
 IF coalesce(gp.community_revision,0)<>p_revision OR gp.status IN('pending_approval','approved','completed') THEN RAISE EXCEPTION 'Participation conflict' USING ERRCODE='PT409';END IF;next_rev:=p_revision+1;
 INSERT INTO public.guild_mission_progress(mission_id,traveler_id,participant_uid,community_revision,status,submitted_at,completion_note,submission_revision)
 VALUES(p_id,p_actor,owner_id,next_rev,'pending_approval',v_now,'ParticipaÃ§Ã£o declarada',1)
 ON CONFLICT(mission_id,traveler_id) DO UPDATE SET community_revision=excluded.community_revision,status='pending_approval',submitted_at=v_now,completion_note='ParticipaÃ§Ã£o declarada',submission_revision=guild_mission_progress.submission_revision+1 RETURNING * INTO gp;
 INSERT INTO public.guild_mission_attempts(mission_id,traveler_id,revision,request_id,note) VALUES(p_id,p_actor,gp.submission_revision,p_request,'ParticipaÃ§Ã£o declarada');
 ELSIF p_action='review' THEN
 PERFORM guild_admin_private.exact_keys(p_data,ARRAY['travelerId','decision','reason']);target:=(p_data->>'travelerId')::uuid;v_status:=p_data->>'decision';
 SELECT user_id INTO target_owner FROM public.travelers WHERE id=target;
 IF target_owner IS NULL OR target_owner=owner_id OR m.status NOT IN('published','closed') OR m.starts_at>v_now OR NOT EXISTS(SELECT 1 FROM public.guild_members WHERE guild_id=p_guild AND traveler_id=target AND status='active') THEN RAISE EXCEPTION 'Cannot validate own account or unavailable participation' USING ERRCODE='42501';END IF;
 IF d.meeting_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.guild_missions WHERE id=d.meeting_id AND status='cancelled') THEN RAISE EXCEPTION 'Parent meeting cancelled' USING ERRCODE='42501';END IF;
 SELECT * INTO gp FROM public.guild_mission_progress WHERE mission_id=p_id AND traveler_id=target AND participant_uid=target_owner FOR UPDATE;
 IF gp.id IS NULL OR gp.community_revision<>p_revision THEN RAISE EXCEPTION 'Participation conflict' USING ERRCODE='PT409';END IF;
 IF v_status IS NULL OR v_status NOT IN('approved','rejected','changes_requested') OR length(coalesce(p_data->>'reason',''))>300 OR (v_status<>'approved' OR gp.status<>'pending_approval' OR m.status='closed') AND length(btrim(coalesce(p_data->>'reason','')))=0 THEN RAISE EXCEPTION 'Objective correction reason required' USING ERRCODE='22023';END IF;
 IF coalesce(p_data->>'reason','') ~* '(bearer[[:space:]]+[a-z0-9._-]+|eyJ[a-z0-9_-]{15,}\.[a-z0-9_-]+|sb_secret_|sbp_|-----BEGIN[[:space:]].*PRIVATE KEY|password[[:space:]]*[:=]|senha[[:space:]]*[:=]|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})' THEN RAISE EXCEPTION 'Do not include credentials or personal contacts in correction reason' USING ERRCODE='22023';END IF;
 previous_status:=gp.status;next_rev:=p_revision+1;
 UPDATE public.guild_mission_progress SET status=v_status,community_revision=next_rev,review_note=coalesce(p_data->>'reason',''),approved_at=CASE WHEN v_status='approved' THEN v_now ELSE NULL END,approved_by_traveler_id=CASE WHEN v_status='approved' THEN p_actor ELSE NULL END WHERE id=gp.id;
 UPDATE public.guild_mission_attempts SET decision=v_status,reason=coalesce(p_data->>'reason',''),reviewer_traveler_id=p_actor,decided_at=v_now,decision_request_id=p_request WHERE mission_id=p_id AND traveler_id=target AND revision=gp.submission_revision;
 INSERT INTO guild_activity_private.validation_history(request_id,mission_id,traveler_id,reviewer_id,before_status,after_status,reason,revision) VALUES(p_request,p_id,target,p_actor,previous_status,v_status,coalesce(p_data->>'reason',''),next_rev);
 INSERT INTO guild_activity_private.future_eligibility(mission_id,owner_id,traveler_id,category,participation_revision,validated) VALUES(p_id,target_owner,target,d.future_category,next_rev,v_status='approved')
 ON CONFLICT ON CONSTRAINT future_eligibility_pkey DO UPDATE SET participation_revision=excluded.participation_revision,validated=excluded.validated,category=excluded.category,updated_at=v_now;
 END IF;
 receipt:=jsonb_build_object('id',p_id,'guildId',p_guild,'action',p_action,'revision',next_rev,'replayed',false,'economicIssued',false);
 INSERT INTO guild_activity_private.commands VALUES(p_request,owner_id,p_actor,p_guild,sig,receipt,v_now);
 INSERT INTO public.guild_activity_log(guild_id,actor_traveler_id,event_type,entity_type,entity_id,metadata) VALUES(p_guild,p_actor,'community_'||p_action,'community_activity',p_id,jsonb_build_object('revision',next_rev,'beforeStatus',previous_status,'afterStatus',CASE WHEN p_action IN('state','review') THEN v_status END,'subject',CASE WHEN p_action IN('delegate','review') THEN target END,'reasonDigest',CASE WHEN p_action='review' THEN md5(coalesce(p_data->>'reason','')) END));
 RETURN receipt;
END $function$
;
CREATE OR REPLACE FUNCTION guild_activity_private.workspace(p_actor uuid, p_guild uuid, p_offset integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE own_role text;ids uuid[];staff boolean;
BEGIN
 own_role:=guild_activity_private.actor_role(p_actor,p_guild);staff:=own_role='leader';
 IF p_offset IS NULL OR p_offset<0 OR p_offset>100000 THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023';END IF;
 SELECT coalesce(array_agg(x.id),'{}') INTO ids FROM(SELECT m.id FROM public.guild_missions m WHERE m.guild_id=p_guild AND m.community_protocol=1 AND
 (staff OR guild_activity_private.can_validate(p_actor,m.id) OR(m.status<>'draft' AND (m.audience='all' OR p_actor=ANY(m.target_traveler_ids) OR EXISTS(SELECT 1 FROM public.guild_mission_progress gp WHERE gp.mission_id=m.id AND gp.participant_uid=auth.uid()))))
 ORDER BY m.starts_at NULLS LAST,m.created_at DESC,m.id LIMIT 25 OFFSET p_offset)x;
 RETURN jsonb_build_object('version',1,'guildId',p_guild,'leader',staff,'hasMore',(cardinality(ids)=25),'offset',p_offset,
 'missions',coalesce((SELECT jsonb_agg(jsonb_build_object('id',m.id,'title',m.title,'description',m.description,'objective',m.objective,'instructions',m.instructions,'evidenceCriterion',m.evidence_criterion,'reference',m.bible_reference,'startsAt',m.starts_at,'dueAt',m.due_at,'status',m.status,'revision',m.workspace_revision,'audience',m.audience,'targetIds',CASE WHEN staff THEN to_jsonb(m.target_traveler_ids) ELSE '[]'::jsonb END,
 'kind',d.kind,'meetingId',d.meeting_id,'category',d.category,'theme',d.theme,'meetingType',d.meeting_type,'responsibleId',d.responsible_id,'accessDetails',CASE WHEN staff OR(m.status='published' AND(m.audience='all' OR p_actor=ANY(m.target_traveler_ids))) THEN d.access_details ELSE '' END,'futureCategory',d.future_category,'canEdit',staff,'canValidate',guild_activity_private.can_validate(p_actor,m.id),
 'canParticipate',m.status='published' AND (m.audience='all' OR p_actor=ANY(m.target_traveler_ids)) AND(m.starts_at IS NULL OR m.starts_at<=clock_timestamp()) AND(m.due_at IS NULL OR m.due_at>=clock_timestamp()) AND(d.meeting_id IS NULL OR EXISTS(SELECT 1 FROM public.guild_missions parent WHERE parent.id=d.meeting_id AND parent.status='published')))
 ORDER BY m.starts_at NULLS LAST,m.created_at DESC,m.id) FROM public.guild_missions m JOIN guild_activity_private.details d ON d.mission_id=m.id WHERE m.id=ANY(ids)),'[]'::jsonb),
 'progress',coalesce((SELECT jsonb_agg(jsonb_build_object('id',gp.id,'missionId',gp.mission_id,'travelerId',gp.traveler_id,'travelerName',t.name,'own',gp.participant_uid=auth.uid(),'status',gp.status,'revision',gp.community_revision,'submittedAt',gp.submitted_at,'approvedAt',gp.approved_at,'reviewNote',gp.review_note)) FROM public.guild_mission_progress gp JOIN public.travelers t ON t.id=gp.traveler_id WHERE gp.mission_id=ANY(ids) AND gp.participant_uid IS NOT NULL AND(gp.participant_uid=auth.uid() OR guild_activity_private.can_validate(p_actor,gp.mission_id))),'[]'::jsonb),
 'members',CASE WHEN staff THEN coalesce((SELECT jsonb_agg(jsonb_build_object('id',t.id,'name',t.name)) FROM public.guild_members gm JOIN public.travelers t ON t.id=gm.traveler_id WHERE gm.guild_id=p_guild AND gm.status='active'),'[]'::jsonb) ELSE '[]'::jsonb END,
 'delegations',coalesce((SELECT jsonb_agg(jsonb_build_object('missionId',d.mission_id,'travelerId',d.traveler_id,'expiresAt',d.expires_at,'active',d.active,'revision',d.revision)) FROM guild_activity_private.delegations d WHERE d.mission_id=ANY(ids) AND(staff OR d.traveler_id=p_actor)),'[]'::jsonb),
 'validations',coalesce((SELECT jsonb_agg(jsonb_build_object('missionId',h.mission_id,'travelerId',h.traveler_id,'reviewerId',h.reviewer_id,'beforeStatus',h.before_status,'afterStatus',h.after_status,'reason',h.reason,'revision',h.revision,'createdAt',h.created_at) ORDER BY h.created_at DESC) FROM guild_activity_private.validation_history h WHERE h.mission_id=ANY(ids) AND guild_activity_private.can_validate(p_actor,h.mission_id)),'[]'::jsonb),
 'history',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC,x.id) FROM(SELECT a.id,a.entity_id,a.event_type,a.actor_traveler_id,a.metadata,a.created_at FROM public.guild_activity_log a WHERE a.guild_id=p_guild AND a.entity_id=ANY(ids) AND a.event_type LIKE 'community_%' AND(staff OR a.actor_traveler_id=p_actor OR a.metadata->>'subject'=p_actor::text OR guild_activity_private.can_validate(p_actor,a.entity_id)) ORDER BY a.created_at DESC,a.id LIMIT 40)x),'[]'::jsonb));
END $function$
;
DROP TRIGGER receipt041_immutable ON public.chest_operations;
DROP TRIGGER content041_immutable ON shop_private.content_041;DROP TRIGGER chest_policy041_immutable ON shop_private.chest_policy_041;
DROP FUNCTION public.purchase_expansion_chest(uuid,text,text,uuid);DROP FUNCTION shop_private.activate_041(text);DROP FUNCTION public.claim_progress_reward(uuid,text,text);DROP FUNCTION shop_private.reward_041(uuid,text,text);DROP FUNCTION public.get_repeated_item_access(uuid,text);DROP FUNCTION shop_private.resale_state_041(uuid,text);DROP TRIGGER reward_policy041_immutable ON shop_private.reward_policy_041;DROP TABLE shop_private.reward_policy_041;
DROP FUNCTION public.sell_repeated_item(uuid,text,uuid,integer);DROP FUNCTION shop_private.sell_041(uuid,text,uuid,integer);DROP FUNCTION shop_private.open_041(uuid,text,uuid);DROP FUNCTION shop_private.purchase_041(uuid,text,uuid);DROP FUNCTION shop_private.ready_041(uuid,uuid);DROP FUNCTION shop_private.pool_ready_041(text);DROP FUNCTION shop_private.rate_limit_041(uuid);DROP FUNCTION shop_private.quantity_041(uuid,uuid,text);DROP FUNCTION shop_private.random_index_041(integer);DROP FUNCTION shop_private.immutable_041();
ALTER TABLE public.inventory DROP CONSTRAINT inventory_card_provenance;ALTER TABLE public.inventory ADD CONSTRAINT inventory_card_provenance CHECK ((((card_receipt_id IS NULL) AND (card_version IS NULL)) OR ((card_receipt_id IS NOT NULL) AND (card_version IS NOT NULL) AND (quantity = 1))));
ALTER TABLE public.chest_operations DROP CONSTRAINT chest_operations_type_check;ALTER TABLE public.chest_operations ADD CONSTRAINT chest_operations_type_check CHECK ((((operation_type = ANY (ARRAY['grant'::text, 'purchase'::text, 'open'::text])) AND (chest_type IS NOT NULL)) OR ((operation_type = ANY (ARRAY['card-starter'::text, 'card-revocation'::text, 'arena-result'::text, 'tower-result'::text, 'community-xp'::text])) AND (chest_type IS NULL)) OR ((operation_type = 'equipment-purchase'::text) AND (chest_type IS NULL) AND (source = 'shop001c:equipment'::text) AND (account_id IS NOT NULL) AND (price_paid IS NOT NULL) AND ((rewards ->> 'catalogVersion'::text) = 'ECONOMY-001C:shop:v1'::text) AND (rewards ? 'itemId'::text)) OR ((operation_type = 'administrative-reconciliation'::text) AND (chest_type IS NULL) AND (account_id IS NOT NULL) AND (price_paid IS NULL) AND (source = 'legacy-admin-010'::text) AND ((rewards ->> 'contract'::text) = 'RPG-ECONOMY-FIX-010:v1'::text)) OR ((operation_type = 'equipment-recognition'::text) AND (chest_type IS NULL) AND (account_id IS NOT NULL) AND (price_paid IS NULL) AND (source = 'legacy-equipment-014'::text) AND ((rewards ->> 'contract'::text) = 'RPG-EQUIPMENT-FIX-014:v1'::text))));
DROP TABLE shop_private.content_041,shop_private.chest_policy_041,shop_private.policy_041;