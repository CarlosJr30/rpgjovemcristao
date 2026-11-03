DO $$BEGIN IF current_setting('shop001c.target_project',true) IS DISTINCT FROM 'wspafhlbtlpabypzymjo' OR public.release_scope()<>'guild-ebd-001' OR EXISTS(SELECT 1 FROM shop_private.holds) OR EXISTS(SELECT 1 FROM public.chest_operations WHERE source LIKE 'shop001c:%') OR EXISTS(SELECT 1 FROM economy_private.community_chest_events) OR EXISTS(SELECT 1 FROM economy_private.community_chest_holds) THEN RAISE EXCEPTION 'Issued history must be preserved; use containment' USING ERRCODE='42501';END IF;END $$;
CREATE OR REPLACE FUNCTION economy_private.open_community_chest_001c(p_actor uuid,p_type text,p_operation uuid) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid;policy economy_private.community_chest_policy;c public.traveler_chests;r public.chest_operations;prior public.chest_operations;
 result_value jsonb;event_uid uuid;m uuid;v uuid;revision integer;actual_balance bigint;expected_balance bigint;
BEGIN
 PERFORM pg_advisory_xact_lock(1010,1);who:=economy_private.community_xp_actor(p_actor);
 IF p_operation IS NULL OR p_type IS NULL OR p_type NOT IN('common','epic') THEN RAISE EXCEPTION 'Approved chest required' USING ERRCODE='22023';END IF;
 -- Recheck after the shared/account lock: a racing retry cannot consume another chest.
 SELECT * INTO prior FROM public.chest_operations WHERE traveler_id=p_actor AND operation_key='open:'||p_operation;
 IF FOUND THEN
 IF prior.operation_type<>'open' OR prior.account_id IS DISTINCT FROM who OR prior.chest_type<>p_type OR prior.source NOT LIKE 'community001c:%' THEN RAISE EXCEPTION 'Operation conflict' USING ERRCODE='22023';END IF;
 RETURN prior.rewards||jsonb_build_object('duplicate',true);END IF;
 SELECT * INTO policy FROM economy_private.community_chest_policy WHERE singleton FOR SHARE;
 IF NOT coalesce(policy.enabled,false) THEN RAISE EXCEPTION 'Chest opening disabled' USING ERRCODE='42501';END IF;
 PERFORM guild_admin_private.require_writes();
 PERFORM 1 FROM public.travelers WHERE id=p_actor AND economic_verified_at IS NOT NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Legacy reconciliation required' USING ERRCODE='42501';END IF;
 SELECT * INTO c FROM public.traveler_chests WHERE traveler_id=p_actor AND chest_type=p_type AND quantity>0 FOR UPDATE;
 IF c.traveler_id IS NULL OR jsonb_array_length(c.sources)<>c.quantity OR(c.sources->>0) NOT LIKE 'community001c:%' THEN RAISE EXCEPTION 'Reviewed chest origin required' USING ERRCODE='42501';END IF;
 SELECT * INTO r FROM public.chest_operations WHERE traveler_id=p_actor AND account_id=who AND operation_type='grant' AND chest_type=p_type AND source=c.sources->>0 AND rewards->>'catalogVersion'=policy.catalog_version;
 IF r.id IS NULL THEN RAISE EXCEPTION 'Grant receipt unavailable' USING ERRCODE='42501';END IF;
 event_uid:=(r.rewards->>'eventId')::uuid;m:=(r.rewards->>'missionId')::uuid;v:=(r.rewards->>'validatorId')::uuid;revision:=(r.rewards->>'participationRevision')::integer;
 IF EXISTS(SELECT 1 FROM economy_private.community_chest_holds WHERE account_id=who AND event_id=event_uid) THEN RETURN jsonb_build_object('version',1,'status','suspended');END IF;
 IF NOT EXISTS(SELECT 1 FROM guild_activity_private.future_eligibility e JOIN public.guild_mission_progress gp ON gp.mission_id=e.mission_id AND gp.traveler_id=e.traveler_id AND gp.participant_uid=e.owner_id
 JOIN public.guild_missions mission ON mission.id=e.mission_id JOIN public.guild_missions root ON root.id=event_uid
 JOIN public.guild_members gm ON gm.guild_id=mission.guild_id AND gm.traveler_id=p_actor AND gm.status='active'
 WHERE e.mission_id=m AND e.owner_id=who AND e.traveler_id=p_actor AND e.validated AND e.participation_revision=revision AND gp.community_revision=revision AND gp.status='approved' AND gp.approved_by_traveler_id=v AND mission.status IN('published','closed') AND root.status IN('published','closed')) THEN RETURN economy_private.community_chest_hold(who,event_uid,m,p_actor,'source-changed');END IF;
 IF NOT economy_private.community_chest_validator(v,m) THEN RETURN economy_private.community_chest_hold(who,event_uid,m,p_actor,'validator-unavailable');END IF;
 SELECT coins INTO actual_balance FROM public.wallets WHERE traveler_id=p_actor FOR UPDATE;
 SELECT coalesce(sum((rewards->>'coins')::bigint),0) INTO expected_balance FROM public.chest_operations WHERE traveler_id=p_actor AND account_id=who AND operation_type='open' AND source LIKE 'community001c:%';
 IF actual_balance IS DISTINCT FROM expected_balance THEN RETURN economy_private.community_chest_hold(who,event_uid,m,p_actor,'balance-inconsistent');END IF;
 result_value:=economy_private.open_chest(p_actor,p_type,p_operation);
 IF ((p_type='common' AND((result_value->>'coins'='25' AND result_value->>'itemId' IS NULL) OR(result_value->>'coins'='10' AND result_value->>'itemId'='traveler-sword-common')))
 OR(p_type='epic' AND((result_value->>'coins'='190' AND result_value->>'itemId' IS NULL) OR(result_value->>'coins'='70' AND result_value->>'itemId'='traveler-helmet-rare')))) IS DISTINCT FROM true THEN RAISE EXCEPTION 'Loot differs from approved catalog' USING ERRCODE='42501';END IF;
 UPDATE public.chest_operations SET account_id=who,identity_key='community-open:v1:'||who||':'||p_operation WHERE traveler_id=p_actor AND operation_key='open:'||p_operation;
 RETURN result_value;
END $$;
DROP FUNCTION public.get_shop(uuid),public.purchase_shop(uuid,text,text,uuid),public.open_shop_chest(uuid,text,uuid),public.equip_shop_item(uuid,text,text,text);
DROP FUNCTION shop_private.equip(uuid,text,text,text),shop_private.owned_equipment(uuid,text,text,text),shop_private.open(uuid,text,uuid),shop_private.purchase(uuid,text,text,uuid),shop_private.state(uuid),shop_private.hold(uuid,uuid,uuid,text),shop_private.actor(uuid),shop_private.balance_valid(uuid),shop_private.coin_balance(uuid);
DROP TABLE shop_private.holds,shop_private.policy;DROP SCHEMA shop_private;
ALTER TABLE public.chest_operations DROP CONSTRAINT chest_operations_type_check;ALTER TABLE public.chest_operations ADD CONSTRAINT chest_operations_type_check CHECK((operation_type IN('grant','purchase','open') AND chest_type IS NOT NULL) OR(operation_type IN('card-starter','card-revocation','arena-result','tower-result','community-xp') AND chest_type IS NULL));
NOTIFY pgrst,'reload schema';
