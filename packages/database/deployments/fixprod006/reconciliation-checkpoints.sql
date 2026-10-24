-- Read-only provenance investigation. Never certifies legacy balances or grants.
WITH baseline AS (
 SELECT '31b70059-deca-44c8-a6df-f21ea68b6e42'::uuid traveler_id,
  999999::bigint coins,245000::bigint xp,
  '2026-10-15T19:31:33.9727Z'::timestamptz observed_at
), timeline AS (
 SELECT o.*,b.coins+sum(CASE WHEN operation_type='open' THEN coalesce((rewards->>'coins')::bigint,0)
  WHEN operation_type='purchase' THEN -price_paid ELSE 0 END)
  OVER(ORDER BY o.created_at,o.id ROWS UNBOUNDED PRECEDING) expected_coins
 FROM public.chest_operations o JOIN baseline b USING(traveler_id)
 WHERE o.created_at>b.observed_at
), checkpoints AS (
 SELECT id,created_at,expected_coins,(rewards->>'coins')::bigint recorded_coins
 FROM timeline WHERE operation_type='purchase'
)
SELECT jsonb_build_object(
 'status','BLOCKED_MISSING_EVENT_PROVENANCE',
 'purchase_checkpoints',(SELECT jsonb_agg(to_jsonb(c)||jsonb_build_object('matches',expected_coins=recorded_coins) ORDER BY created_at) FROM checkpoints c),
 'all_purchase_checkpoints_match',(SELECT bool_and(expected_coins=recorded_coins) FROM checkpoints),
 'last_receipted_operation',(SELECT max(created_at) FROM timeline),
 'expected_coins',(SELECT expected_coins FROM timeline ORDER BY created_at DESC,id DESC LIMIT 1),
 'actual_coins',w.coins,'unexplained_coins',w.coins-(SELECT expected_coins FROM timeline ORDER BY created_at DESC,id DESC LIMIT 1),
 'actual_xp',t.xp,'unexplained_xp',t.xp-b.xp,
 'battle_events',(SELECT count(*) FROM economy_private.battles WHERE traveler_id=t.id),
 'guild_reward_claims',(SELECT count(*) FROM public.guild_reward_claims WHERE traveler_id=t.id),
 'journey_reward_events',(SELECT count(*) FROM economy_private.journey_rewards WHERE traveler_id=t.id),
 'journey_operations',(SELECT count(*) FROM economy_private.journey_operations WHERE traveler_id=t.id),
 'ebd_pending',(SELECT count(*) FROM public.guild_ebd_reward_pending WHERE traveler_id=t.id),
 'verified_at',t.economic_verified_at
) FROM baseline b JOIN public.travelers t ON t.id=b.traveler_id
 JOIN public.wallets w ON w.traveler_id=t.id;
