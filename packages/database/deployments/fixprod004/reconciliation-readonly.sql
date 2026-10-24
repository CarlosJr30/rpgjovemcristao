-- Diagnostic only. No grant, verification flag, ledger insertion or balance update.
-- Baseline authority: TASK-0077 provisioning-evidence.json, 2026-10-15.
-- Keep the private evidence and backup outside Git. A matching subtotal is not
-- sufficient to authorize economic_verified_at while any delta is unexplained.
WITH baseline AS (
 SELECT '31b70059-deca-44c8-a6df-f21ea68b6e42'::uuid traveler_id,
        245000::bigint xp,999999::bigint coins
), ledger AS (
 SELECT b.traveler_id,
 coalesce(sum((o.rewards->>'coins')::bigint) FILTER(WHERE o.operation_type='open'),0) coin_rewards,
 coalesce(sum(o.price_paid) FILTER(WHERE o.operation_type='purchase'),0) coin_costs
 FROM baseline b LEFT JOIN public.chest_operations o USING(traveler_id)
 GROUP BY b.traveler_id
)
SELECT t.id,t.xp actual_xp,w.coins actual_coins,
 b.xp documented_admin_xp,b.coins documented_admin_coins,
 l.coin_rewards,l.coin_costs,
 t.xp-b.xp unexplained_xp_delta,
 w.coins-(b.coins+l.coin_rewards-l.coin_costs) unexplained_coin_delta,
 t.economic_verified_at,
 CASE WHEN t.xp<>b.xp OR w.coins<>(b.coins+l.coin_rewards-l.coin_costs)
 THEN 'BLOCKED_MISSING_EVENT_PROVENANCE'
 ELSE 'REQUIRES_FULL_PROVENANCE_REVIEW' END audit_status
FROM baseline b JOIN public.travelers t ON t.id=b.traveler_id
 JOIN public.wallets w ON w.traveler_id=t.id
 JOIN ledger l ON l.traveler_id=t.id;
