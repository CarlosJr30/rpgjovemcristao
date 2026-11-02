-- PRODUCTION PACKAGE: owner-approved catalog and restricted starter bridge. No player grant.
-- Apply in one transaction with audited target and preflight authority hash.
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $$ BEGIN
 IF current_setting('economy001a.target_project',true) IS DISTINCT FROM 'wspafhlbtlpabypzymjo'
 OR public.release_scope() IS DISTINCT FROM 'guild-ebd-001'
 OR public.economy_protocol_version() IS DISTINCT FROM 3 THEN
  RAISE EXCEPTION 'Production target denied' USING ERRCODE='42501';
 END IF;
 IF current_setting('economy001a.authority_md5',true) IS DISTINCT FROM
  md5(replace(pg_get_functiondef('public.arena_authority_v3(uuid,uuid,text,jsonb)'::regprocedure),chr(13),''))
 OR has_function_privilege('authenticated','public.arena_authority_v3(uuid,uuid,text,jsonb)','EXECUTE')
 OR has_function_privilege('anon','public.arena_authority_v3(uuid,uuid,text,jsonb)','EXECUTE')
 OR has_function_privilege('service_role','public.arena_authority_v3(uuid,uuid,text,jsonb)','EXECUTE')
 OR NOT has_schema_privilege('authenticated','economy_private','USAGE') THEN
  RAISE EXCEPTION 'Audited authority boundary required' USING ERRCODE='42501';
 END IF;
END $$;

DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM economy_private.card_catalog) THEN RAISE EXCEPTION 'Expected empty production catalog' USING ERRCODE='42501'; END IF;
END $$;
INSERT INTO economy_private.card_catalog(version,id,definition,approval_ref,starter)
SELECT 'arena-cards-2026-11-02.1-economy-001a',value->>'id',value,'ECONOMY-001A:OWNER:2026-11-02',true
FROM jsonb_array_elements('[{"id":"arena-card-basic-attack","action":"attack","name":"Ataque Simples","type":"OFFENSIVE","rarity":"comum","description":{"focusCost":0,"minimumLevel":1,"condition":"Carta selecionada, ainda não usada; batalha aberta e rodada atual.","headline":"Ataque básico · até +1 Foco","explanation":"Ao executar, gera até 1 Foco, limitado a 3; se cair antes de agir, não gera Foco. Parcela ofensiva = 3 + 2,2 × Força + 0,18 × soma do poder de todos os itens equipados. Subtrai 1,15 × Defesa do alvo; aplica multiplicadores e arredonda ao inteiro mais próximo, mínimo 1. Atributos e poder de cada item limitados a 0–999. Guarda/armadura arredondam para cima em etapas; esquiva causa 0 e dano aplicado não ultrapassa o HP restante.","duration":"Um ataque aceito; bônus preparados são consumidos quando o ataque é executado."},"parameters":{"baseDamage":3,"strengthMultiplier":2.2,"equipmentPowerMultiplier":0.18,"defenseMultiplier":1.15,"minimumDamage":1,"maximumStat":999,"offensiveMultiplier":1,"gainedFocus":1,"maximumSpecialPowerMultiplier":1.25,"maximumFocus":3},"minimumLevel":1,"focusCost":0,"usesPerBattle":1,"remainsOwnedAfterBattle":true,"catalogVersion":"arena-cards-2026-11-02.1-economy-001a","balanceVersion":"arena-v2-measured-strike-003a.1","biblicalReference":null,"art":{"approved":false,"reference":null},"homologation":{"status":"approved","approvalReference":"ECONOMY-001A:OWNER:2026-11-02"},"acquisition":{"status":"enabled","proposedSources":["starter","chest","guild-mission","journey","authorized-challenge"],"authorizedSources":["starter"],"approvalReference":"ECONOMY-001A:OWNER:2026-11-02"}},{"id":"arena-card-basic-defense","action":"defend","name":"Defesa","type":"DEFENSIVE","rarity":"comum","description":{"focusCost":0,"minimumLevel":1,"condition":"Carta selecionada, ainda não usada; batalha aberta e rodada atual.","headline":"Dano recebido ×0,5 · até +1 Foco","explanation":"Gera até 1 Foco, limitado a 3. Aplica ×0,5 ao dano já arredondado do próximo golpe recebido. Arredonda para cima, mínimo 1; a redução final pode variar pelo arredondamento. Não soma Defesa nem cura. A armadura pode multiplicar a proteção depois.","duration":"Até receber um golpe não esquivado; sem prazo fixo em turnos. Não substitui uma Guarda forte já preparada."},"parameters":{"receivedDamageMultiplier":0.5,"armorMultiplier":0.85,"minimumDamage":1,"gainedFocus":1,"maximumFocus":3},"minimumLevel":1,"focusCost":0,"usesPerBattle":1,"remainsOwnedAfterBattle":true,"catalogVersion":"arena-cards-2026-11-02.1-economy-001a","balanceVersion":"arena-v2-measured-strike-003a.1","biblicalReference":null,"art":{"approved":false,"reference":null},"homologation":{"status":"approved","approvalReference":"ECONOMY-001A:OWNER:2026-11-02"},"acquisition":{"status":"enabled","proposedSources":["starter","chest","guild-mission","journey","authorized-challenge"],"authorizedSources":["starter"],"approvalReference":"ECONOMY-001A:OWNER:2026-11-02"}},{"id":"arena-card-path-strike","action":"special:path-strike","name":"Golpe do Caminho","type":"OFFENSIVE","rarity":"comum","description":{"focusCost":2,"minimumLevel":2,"condition":"Carta selecionada, ainda não usada; batalha aberta e rodada atual.","headline":"Golpe ×1,45","explanation":"Multiplica por 1,45 a parcela ofensiva menos a Defesa, antes do arredondamento e da guarda. Não é percentual da vida do alvo. Modificador de potência do snapshot: ×1. Reforços da espada e vantagem preparada podem multiplicar esse resultado.","duration":"Um ataque; carta consumida após aceite. Se cair antes de agir, o turno aceito ainda gasta a carta."},"parameters":{"baseDamage":3,"strengthMultiplier":2.2,"equipmentPowerMultiplier":0.18,"defenseMultiplier":1.15,"minimumDamage":1,"maximumStat":999,"offensiveMultiplier":1.45,"gainedFocus":0,"maximumSpecialPowerMultiplier":1.25,"maximumFocus":3},"minimumLevel":2,"focusCost":2,"usesPerBattle":1,"remainsOwnedAfterBattle":true,"catalogVersion":"arena-cards-2026-11-02.1-economy-001a","balanceVersion":"arena-v2-measured-strike-003a.1","biblicalReference":null,"art":{"approved":false,"reference":null},"homologation":{"status":"approved","approvalReference":"ECONOMY-001A:OWNER:2026-11-02"},"acquisition":{"status":"enabled","proposedSources":["starter","chest","guild-mission","journey","authorized-challenge"],"authorizedSources":["starter"],"approvalReference":"ECONOMY-001A:OWNER:2026-11-02"}},{"id":"arena-card-steadfast-guard","action":"special:steadfast-guard","name":"Guarda Perseverante","type":"DEFENSIVE","rarity":"comum","description":{"focusCost":2,"minimumLevel":4,"condition":"Carta selecionada, ainda não usada; batalha aberta e rodada atual.","headline":"Próximo dano recebido ×0,25","explanation":"Guarda preparada antes da iniciativa; aplica ×0,25 ao dano já arredondado, no lugar da defesa básica ×0,5. Arredonda para cima, mínimo 1; a redução final pode variar pelo arredondamento. O escudo não acrescenta outro multiplicador.","duration":"Próximo golpe não esquivado; permanece preparada até esse golpe, sem prazo fixo em turnos."},"parameters":{"receivedDamageMultiplier":0.25,"armorMultiplier":0.85,"minimumDamage":1,"gainedFocus":0,"maximumFocus":3},"minimumLevel":4,"focusCost":2,"usesPerBattle":1,"remainsOwnedAfterBattle":true,"catalogVersion":"arena-cards-2026-11-02.1-economy-001a","balanceVersion":"arena-v2-measured-strike-003a.1","biblicalReference":null,"art":{"approved":false,"reference":null},"homologation":{"status":"approved","approvalReference":"ECONOMY-001A:OWNER:2026-11-02"},"acquisition":{"status":"enabled","proposedSources":["starter","chest","guild-mission","journey","authorized-challenge"],"authorizedSources":["starter"],"approvalReference":"ECONOMY-001A:OWNER:2026-11-02"}},{"id":"arena-card-discernment","action":"special:discernment","name":"Discernimento","type":"TACTICAL","rarity":"comum","description":{"focusCost":2,"minimumLevel":6,"condition":"Carta selecionada, ainda não usada; batalha aberta e rodada atual.","headline":"Próximo ataque até ×1,55","explanation":"Prepara multiplicador 1,18 + 0,035 × Sabedoria, limitado a 1,55. Aplica sobre a parcela ofensiva menos a Defesa, antes do arredondamento. Revela somente a intenção provável permitida pela mecânica após o uso.","duration":"Próximo ataque executado, básico ou Golpe; substitui a vantagem anterior, não acumula. Defesa não a consome."},"parameters":{"baseMultiplier":1.18,"wisdomMultiplier":0.035,"maximumMultiplier":1.55,"amuletBoost":0.15,"maximumStat":999,"maximumFocus":3},"minimumLevel":6,"focusCost":2,"usesPerBattle":1,"remainsOwnedAfterBattle":true,"catalogVersion":"arena-cards-2026-11-02.1-economy-001a","balanceVersion":"arena-v2-measured-strike-003a.1","biblicalReference":null,"art":{"approved":false,"reference":null},"homologation":{"status":"approved","approvalReference":"ECONOMY-001A:OWNER:2026-11-02"},"acquisition":{"status":"enabled","proposedSources":["starter","chest","guild-mission","journey","authorized-challenge"],"authorizedSources":["starter"],"approvalReference":"ECONOMY-001A:OWNER:2026-11-02"}},{"id":"arena-card-pilgrim-step","action":"special:pilgrim-step","name":"Passo do Peregrino","type":"TACTICAL","rarity":"comum","description":{"focusCost":3,"minimumLevel":8,"condition":"Carta selecionada, ainda não usada; batalha aberta e rodada atual.","headline":"Evita o próximo golpe recebido · dano 0","explanation":"Prepara uma esquiva garantida para um golpe recebido; não usa probabilidade nem recupera vida. Tem prioridade sobre o uso automático das botas.","duration":"Um golpe recebido; permanece até ocorrer, sem prazo fixo em turnos. Não acumula esquivas ao repetir."},"parameters":{"avoidedHits":1,"receivedDamage":0,"maximumFocus":3},"minimumLevel":8,"focusCost":3,"usesPerBattle":1,"remainsOwnedAfterBattle":true,"catalogVersion":"arena-cards-2026-11-02.1-economy-001a","balanceVersion":"arena-v2-measured-strike-003a.1","biblicalReference":null,"art":{"approved":false,"reference":null},"homologation":{"status":"approved","approvalReference":"ECONOMY-001A:OWNER:2026-11-02"},"acquisition":{"status":"enabled","proposedSources":["starter","chest","guild-mission","journey","authorized-challenge"],"authorizedSources":["starter"],"approvalReference":"ECONOMY-001A:OWNER:2026-11-02"}},{"id":"arena-card-measured-strike","action":"special:measured-strike","name":"Golpe Medido","type":"OFFENSIVE","rarity":"comum","description":{"focusCost":1,"minimumLevel":1,"condition":"Carta selecionada, ainda não usada; batalha aberta e rodada atual.","headline":"Golpe Medido ×1,15","explanation":"Multiplica por 1,15 a parcela ofensiva menos a Defesa, antes do arredondamento e da guarda. Não é aumento fixo do dano final nem percentual da vida. Modificador de potência do snapshot: ×1. Vantagem preparada e bônus da espada após Defender continuam aplicáveis; o reforço ativo exclusivo do Golpe do Caminho não é ativado. Não gera Foco; descontos respeitam o piso de 1 Foco.","duration":"Um ataque; uma utilização por batalha. Carta consumida somente após comando aceito, mesmo se cair antes de agir. Permanece na coleção e volta na próxima batalha."},"parameters":{"baseDamage":3,"strengthMultiplier":2.2,"equipmentPowerMultiplier":0.18,"defenseMultiplier":1.15,"minimumDamage":1,"maximumStat":999,"offensiveMultiplier":1.15,"gainedFocus":0,"maximumSpecialPowerMultiplier":1.25,"maximumFocus":3},"minimumLevel":1,"focusCost":1,"usesPerBattle":1,"remainsOwnedAfterBattle":true,"catalogVersion":"arena-cards-2026-11-02.1-economy-001a","balanceVersion":"arena-v2-measured-strike-003a.1","biblicalReference":null,"art":{"approved":false,"reference":null},"homologation":{"status":"approved","approvalReference":"ECONOMY-001A:OWNER:2026-11-02"},"acquisition":{"status":"enabled","proposedSources":["starter","chest","guild-mission","journey","authorized-challenge"],"authorizedSources":["starter"],"approvalReference":"ECONOMY-001A:OWNER:2026-11-02"}}]'::jsonb);

CREATE FUNCTION economy_private.claim_arena_starter_001a(p_traveler_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); session_text text:=auth.jwt()->>'session_id';
 receipt jsonb; claimed_traveler uuid; catalog_hash text;
BEGIN
 -- Preserve existing lock order: Auth identity, then its traveler and receipts.
 PERFORM 1 FROM auth.users u WHERE u.id=actor AND NOT coalesce(u.is_anonymous,false)
  AND u.email_confirmed_at IS NOT NULL AND u.deleted_at IS NULL
  AND (u.banned_until IS NULL OR u.banned_until<=clock_timestamp()) FOR UPDATE;
 IF NOT FOUND OR session_text IS NULL OR session_text !~* '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' THEN
  RAISE EXCEPTION 'Account unavailable' USING ERRCODE='42501';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.sessions s WHERE s.id=session_text::uuid AND s.user_id=actor
  AND (s.not_after IS NULL OR s.not_after>clock_timestamp())) THEN
  RAISE EXCEPTION 'Session unavailable' USING ERRCODE='42501';
 END IF;
 PERFORM 1 FROM public.travelers t WHERE t.id=p_traveler_id AND t.user_id=actor AND t.is_active FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Traveler unavailable' USING ERRCODE='42501'; END IF;
 -- Freeze eligibility during the delegated transaction, including revocation.
 PERFORM 1 FROM economy_private.card_catalog c
  WHERE c.version='arena-cards-2026-11-02.1-economy-001a' ORDER BY c.id FOR SHARE;
 SELECT md5(jsonb_agg(c.definition ORDER BY c.id)::text) INTO catalog_hash
 FROM economy_private.card_catalog c WHERE c.version='arena-cards-2026-11-02.1-economy-001a'
  AND c.approval_ref='ECONOMY-001A:OWNER:2026-11-02' AND c.starter AND c.revoked_at IS NULL;
 IF catalog_hash IS DISTINCT FROM 'b1d3e9196a37ee5c84456ab7c325978d' THEN
  RAISE EXCEPTION 'Approved starter unavailable' USING ERRCODE='42501';
 END IF;
 -- Delegate only the existing fixed operation; no actor/amount/card IDs from client.
 receipt:=public.arena_authority_v3(actor,p_traveler_id,'starter','{}'::jsonb);
 IF receipt->>'account_id' IS DISTINCT FROM actor::text
 OR receipt->>'operation_type' IS DISTINCT FROM 'card-starter'
 OR receipt->>'source' IS DISTINCT FROM 'approved-starter'
 OR receipt->'rewards'->>'catalogVersion' IS DISTINCT FROM 'arena-cards-2026-11-02.1-economy-001a'
 OR jsonb_typeof(receipt->'rewards'->'cardIds') IS DISTINCT FROM 'array'
 OR jsonb_array_length(receipt->'rewards'->'cardIds') IS DISTINCT FROM 7 THEN
  RAISE EXCEPTION 'Starter receipt unavailable' USING ERRCODE='42501';
 END IF;
 claimed_traveler:=(receipt->>'traveler_id')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.travelers t WHERE t.id=claimed_traveler AND t.user_id=actor) THEN
  RAISE EXCEPTION 'Starter receipt unavailable' USING ERRCODE='42501';
 END IF;
 RETURN jsonb_build_object('receiptId',receipt->>'id','travelerId',claimed_traveler,
  'catalogVersion',receipt->'rewards'->>'catalogVersion',
  'status',CASE WHEN claimed_traveler=p_traveler_id THEN 'available' ELSE 'claimed-on-another-traveler' END);
END $$;
REVOKE ALL ON FUNCTION economy_private.claim_arena_starter_001a(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION economy_private.claim_arena_starter_001a(uuid) TO authenticated;

CREATE FUNCTION public.claim_arena_starter(p_traveler_id uuid) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT economy_private.claim_arena_starter_001a(p_traveler_id)
$$;
REVOKE ALL ON FUNCTION public.claim_arena_starter(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.claim_arena_starter(uuid) TO authenticated;
COMMENT ON FUNCTION economy_private.claim_arena_starter_001a(uuid) IS
 'ECONOMY-001A PROD: delegates existing explicit once-per-Auth-account starter; confirmed current session/own active traveler/frozen approved production catalog only. No balance or QA authority.';
NOTIFY pgrst,'reload schema';
