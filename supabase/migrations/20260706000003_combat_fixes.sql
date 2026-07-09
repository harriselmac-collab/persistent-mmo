-- Description: Align combat and warfare RPCs for frontend compatibility.

-- 1. [REMOVED] fight_in_battle alignment (removed to prevent recursive stack overflow)


-- 2. rpc_declare_war alignment
CREATE OR REPLACE FUNCTION public.rpc_declare_war(
  p_war_declaring_country_id INT,
  p_war_target_country_id INT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN rpc_declare_war(p_war_target_country_id);
END;
$$ LANGUAGE plpgsql;

-- 3. [REMOVED] rpc_command_army_movement alignment (removed to prevent recursive stack overflow)


-- 4. [REMOVED] rpc_engage_military_battle alignment (removed to prevent recursive stack overflow)


-- 5. rpc_propose_peace_treaty alignment
CREATE OR REPLACE FUNCTION public.rpc_propose_peace_treaty(
  p_war_id INT,
  p_gold_transfer NUMERIC,
  p_currency_transfers JSONB,
  p_region_transfers JSONB
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN rpc_propose_peace_treaty(
    p_war_id,
    p_gold_transfer,
    jsonb_build_object(
      'currency_transfers', p_currency_transfers,
      'region_transfers', p_region_transfers
    )
  );
END;
$$ LANGUAGE plpgsql;
