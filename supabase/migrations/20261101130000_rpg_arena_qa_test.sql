-- TEST-only QA authority. No allocations are made by this migration.
DO $$ BEGIN
 IF current_setting('arena_qa.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg'
 OR public.release_scope() IS DISTINCT FROM 'hero-equipment-006' THEN
  RAISE EXCEPTION 'Arena QA requires explicit TEST project and scope' USING ERRCODE='42501';
 END IF;
 IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='economy_private' AND p.proname='get_owned_cards'
       AND p.prosrc LIKE '%RETURN economy_private.collection(actor,p_traveler_id);%')<>1 THEN
  RAISE EXCEPTION 'Owned-card contract changed';
 END IF;
END $$;
CREATE SCHEMA arena_qa_private;
REVOKE ALL ON SCHEMA arena_qa_private FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE arena_qa_private.allocations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 traveler_id uuid NOT NULL UNIQUE REFERENCES public.travelers(id) ON DELETE RESTRICT,
 request_id uuid NOT NULL UNIQUE,
 approval text NOT NULL CHECK(approval='RPG-ARENA-TORRE-001:QA-2026-11-01'),
 reason text NOT NULL CHECK(length(reason) BETWEEN 1 AND 500),
 catalog_version text NOT NULL CHECK(catalog_version='arena-cards-2026-10-20.2-fixprod003-test'),
 card_ids jsonb NOT NULL CHECK(jsonb_typeof(card_ids)='array' AND jsonb_array_length(card_ids)=7),
 training_level integer NOT NULL DEFAULT 50 CHECK(training_level=50),
 issuer_role name NOT NULL DEFAULT current_user CHECK(issuer_role='postgres'),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(owner_id,approval),
 UNIQUE(id,traveler_id)
);
CREATE TABLE arena_qa_private.revocations (
 allocation_id uuid PRIMARY KEY REFERENCES arena_qa_private.allocations(id) ON DELETE RESTRICT,
 reason text NOT NULL CHECK(length(reason) BETWEEN 1 AND 500),
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE arena_qa_private.allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_qa_private.revocations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA arena_qa_private FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION arena_qa_private.immutable_record() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN RAISE EXCEPTION 'QA audit is append-only' USING ERRCODE='42501'; END $$;
CREATE TRIGGER allocation_append_only BEFORE UPDATE OR DELETE ON arena_qa_private.allocations
 FOR EACH ROW EXECUTE FUNCTION arena_qa_private.immutable_record();
CREATE TRIGGER revocation_append_only BEFORE UPDATE OR DELETE ON arena_qa_private.revocations
 FOR EACH ROW EXECUTE FUNCTION arena_qa_private.immutable_record();
ALTER TABLE public.inventory ADD COLUMN arena_qa_receipt_id uuid;
ALTER TABLE public.inventory ADD CONSTRAINT inventory_qa_owner_fk FOREIGN KEY(arena_qa_receipt_id,traveler_id)
 REFERENCES arena_qa_private.allocations(id,traveler_id) ON DELETE RESTRICT;
ALTER TABLE public.inventory ADD CONSTRAINT inventory_qa_provenance CHECK(arena_qa_receipt_id IS NULL OR
 (card_receipt_id IS NULL AND card_version IS NULL AND card_revoked_at IS NULL AND card_revocation_receipt_id IS NULL AND quantity=1));
CREATE FUNCTION arena_qa_private.protect_inventory() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF current_user<>'postgres' AND
  (CASE WHEN TG_OP='DELETE' THEN OLD.arena_qa_receipt_id IS NOT NULL
        WHEN TG_OP='INSERT' THEN NEW.arena_qa_receipt_id IS NOT NULL
        ELSE OLD.arena_qa_receipt_id IS NOT NULL OR NEW.arena_qa_receipt_id IS NOT NULL END) THEN
   RAISE EXCEPTION 'QA inventory is owner-controlled' USING ERRCODE='42501';
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
NOTIFY pgrst,'reload schema';
CREATE TRIGGER arena_qa_inventory_guard BEFORE INSERT OR UPDATE OR DELETE ON public.inventory
 FOR EACH ROW EXECUTE FUNCTION arena_qa_private.protect_inventory();

-- SQL owner only. Fixed new avatar, no mutation of existing avatars/selection.
CREATE FUNCTION arena_qa_private.prepare(p_owner uuid,p_request uuid,p_reason text) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE a arena_qa_private.allocations; v_traveler uuid; ids jsonb;
BEGIN
 IF current_user<>'postgres' OR public.release_scope()<>'hero-equipment-006'
 OR current_setting('arena_qa.target_project',true) IS DISTINCT FROM 'wkdvdzfkbwvhyjmamrsg' THEN
  RAISE EXCEPTION 'Private TEST preparation only' USING ERRCODE='42501'; END IF;
 IF p_owner IS NULL OR p_request IS NULL OR length(coalesce(p_reason,'')) NOT BETWEEN 1 AND 500
 OR p_reason ~* '(https?://|@|bearer |password|senha|token)' THEN
  RAISE EXCEPTION 'Reviewed reason and request required' USING ERRCODE='22023'; END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_owner AND NOT coalesce(is_anonymous,false) AND email_confirmed_at IS NOT NULL) THEN
  RAISE EXCEPTION 'Confirmed TEST identity required' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('arena-qa:'||p_owner::text,0));
 SELECT * INTO a FROM arena_qa_private.allocations WHERE owner_id=p_owner;
 IF FOUND THEN
  IF a.request_id<>p_request OR a.reason<>p_reason OR EXISTS(SELECT 1 FROM arena_qa_private.revocations WHERE allocation_id=a.id) THEN
   RAISE EXCEPTION 'QA allocation conflict' USING ERRCODE='PT409'; END IF;
  RETURN a.traveler_id;
 END IF;
 IF EXISTS(SELECT 1 FROM public.travelers WHERE user_id=p_owner AND name='QA Arena Torre') THEN
  RAISE EXCEPTION 'QA avatar already exists without reviewed allocation' USING ERRCODE='PT409'; END IF;
 SELECT jsonb_agg(id ORDER BY id) INTO ids FROM economy_private.card_catalog
 WHERE version='arena-cards-2026-10-20.2-fixprod003-test' AND revoked_at IS NULL
 AND approval_ref='FIX-PROD-003:TEST-ONLY:2026-10-23' AND definition->'homologation'->>'status'='approved';
 IF jsonb_array_length(ids) IS DISTINCT FROM 7 OR
  (SELECT md5(string_agg(definition::text,'|' ORDER BY id)) FROM economy_private.card_catalog
   WHERE version='arena-cards-2026-10-20.2-fixprod003-test' AND revoked_at IS NULL)<>'b30f75cad973796f780ca37f8d021a91' THEN
  RAISE EXCEPTION 'Frozen TEST catalog required' USING ERRCODE='42501'; END IF;
 INSERT INTO public.travelers(user_id,name,body_type,skin_tone,hair_style,avatar_variant,level,xp,is_active)
 VALUES(p_owner,'QA Arena Torre','male','medio','curto','musgo',1,0,false) RETURNING id INTO v_traveler;
 INSERT INTO public.traveler_stats(traveler_id) VALUES(v_traveler);
 INSERT INTO public.wallets(traveler_id) VALUES(v_traveler);
 INSERT INTO arena_qa_private.allocations(owner_id,traveler_id,request_id,approval,reason,catalog_version,card_ids)
 VALUES(p_owner,v_traveler,p_request,'RPG-ARENA-TORRE-001:QA-2026-11-01',p_reason,'arena-cards-2026-10-20.2-fixprod003-test',ids) RETURNING * INTO a;
 INSERT INTO public.inventory(traveler_id,item_id,quantity,metadata,arena_qa_receipt_id)
 SELECT v_traveler,c.id,1,jsonb_build_object('source','qa-training','approval',a.approval),a.id
 FROM economy_private.card_catalog c WHERE ids ? c.id AND c.version=a.catalog_version;
 RETURN v_traveler;
END $$;

CREATE FUNCTION arena_qa_private.owned_cards(p_traveler uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('card',c.definition,'version',c.version,'receiptId',a.id,'provenance','qa-training') ORDER BY c.id),'[]'::jsonb)
 FROM arena_qa_private.allocations a JOIN public.inventory i ON i.arena_qa_receipt_id=a.id AND i.traveler_id=a.traveler_id
 JOIN public.travelers t ON t.id=a.traveler_id AND t.user_id=a.owner_id
 JOIN auth.users u ON u.id=a.owner_id
 JOIN economy_private.card_catalog c ON c.id=i.item_id AND c.version=a.catalog_version
 WHERE public.release_scope()='hero-equipment-006' AND a.traveler_id=p_traveler AND a.owner_id=auth.uid()
 AND NOT coalesce(u.is_anonymous,false) AND u.email_confirmed_at IS NOT NULL AND t.level=1 AND t.xp=0 AND i.quantity=1 AND a.card_ids ? i.item_id
 AND i.card_receipt_id IS NULL AND i.card_version IS NULL AND c.revoked_at IS NULL
 AND NOT EXISTS(SELECT 1 FROM arena_qa_private.revocations WHERE allocation_id=a.id)
 AND (SELECT md5(string_agg(definition::text,'|' ORDER BY id)) FROM economy_private.card_catalog
      WHERE version=a.catalog_version AND revoked_at IS NULL)='b30f75cad973796f780ca37f8d021a91';
$$;
CREATE FUNCTION arena_qa_private.profile(p_traveler uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('kind','qa-training','trainingLevel',a.training_level,'canonicalLevel',t.level,'canonicalXp',t.xp)
 FROM arena_qa_private.allocations a JOIN public.travelers t ON t.id=a.traveler_id AND t.user_id=a.owner_id
 JOIN auth.users u ON u.id=a.owner_id
 WHERE public.release_scope()='hero-equipment-006' AND a.traveler_id=p_traveler AND a.owner_id=auth.uid()
 AND NOT coalesce(u.is_anonymous,false) AND u.email_confirmed_at IS NOT NULL AND t.level=1 AND t.xp=0
 AND NOT EXISTS(SELECT 1 FROM arena_qa_private.revocations WHERE allocation_id=a.id);
$$;
CREATE FUNCTION public.get_arena_qa_profile(p_traveler_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT arena_qa_private.profile(p_traveler_id); $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA arena_qa_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.get_arena_qa_profile(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT USAGE ON SCHEMA arena_qa_private TO authenticated;
GRANT EXECUTE ON FUNCTION arena_qa_private.profile(uuid),public.get_arena_qa_profile(uuid) TO authenticated;
-- Existing owner/nonanonymous checks and public ACL are preserved. Official
-- economic collection/authority remain unchanged and cannot consume QA cards.
DO $$ DECLARE source text; BEGIN
 SELECT pg_get_functiondef('economy_private.get_owned_cards(uuid)'::regprocedure) INTO source;
 EXECUTE replace(source,'RETURN economy_private.collection(actor,p_traveler_id);',
 'RETURN economy_private.collection(actor,p_traveler_id) || arena_qa_private.owned_cards(p_traveler_id);');
END $$;
