-- ==========================================
-- PHASE 8b: COMBAT MECHANICS & STRENGTH TRAINING
-- ==========================================

-- 1. Strength Training RPC
CREATE OR REPLACE FUNCTION public.train_strength()
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  stat_rec RECORD;
  new_level INT;
  new_exp BIGINT;
  curr_energy INT;
  leveled_up BOOLEAN := FALSE;
  required_exp BIGINT;
  strength_gain NUMERIC(12,4) := 0.1000;
  exp_gain BIGINT := 10;
  energy_cost INT := 10;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  -- Get current player stats
  SELECT * INTO stat_rec FROM public.player_stats WHERE profile_id = caller_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Player statistics not found.');
  END IF;

  -- Check energy
  IF stat_rec.energy < energy_cost THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Insufficient energy. Training requires ' || energy_cost || ' energy.',
      'energy_remaining', stat_rec.energy
    );
  END IF;

  -- Calculate new stats
  curr_energy := stat_rec.energy - energy_cost;
  new_exp := stat_rec.experience + exp_gain;
  new_level := stat_rec.level;

  -- Level up loop
  LOOP
    SELECT required_experience INTO required_exp FROM public.experience_tables WHERE level = new_level;
    IF required_exp IS NULL THEN
      EXIT; -- Max level threshold exceeded
    END IF;

    IF new_exp >= required_exp THEN
      new_exp := new_exp - required_exp;
      new_level := new_level + 1;
      leveled_up := TRUE;
      curr_energy := 100; -- Full energy restore on level up!
    ELSE
      EXIT;
    END IF;
  END LOOP;

  -- Commit updates
  UPDATE public.player_stats
  SET 
    level = new_level,
    experience = new_exp,
    energy = curr_energy,
    strength = strength + strength_gain,
    last_train_at = now(),
    updated_at = now()
  WHERE profile_id = caller_id;

  -- Record energy history
  INSERT INTO public.energy_history (profile_id, change_amount, reason)
  VALUES (caller_id, -energy_cost, 'strength_training');

  -- Record audit log
  INSERT INTO public.audit_logs (profile_id, action, metadata)
  VALUES (caller_id, 'strength.train', jsonb_build_object(
    'strength_gained', strength_gain,
    'experience_earned', exp_gain,
    'energy_spent', energy_cost,
    'leveled_up', leveled_up
  ));

  RETURN json_build_object(
    'success', true,
    'strength_gained', strength_gain,
    'exp_gained', exp_gain,
    'energy_remaining', curr_energy,
    'leveled_up', leveled_up,
    'new_level', new_level,
    'error', null
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', 'Training transaction aborted: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 2. Regional Warfare Fight RPC
CREATE OR REPLACE FUNCTION public.fight_in_battle(
  battle_id UUID,
  side_country_id INT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  profile_rec RECORD;
  stat_rec RECORD;
  battle_rec RECORD;
  weapon_row RECORD;
  weapon_modifier NUMERIC := 1.0;
  base_damage INT := 10;
  damage INT;
  new_level INT;
  new_exp BIGINT;
  curr_energy INT;
  leveled_up BOOLEAN := FALSE;
  required_exp BIGINT;
  xp_gain INT := 2;
  energy_cost INT := 10;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  -- Load profile and statistics
  SELECT * INTO profile_rec FROM public.profiles WHERE id = caller_id;
  SELECT * INTO stat_rec FROM public.player_stats WHERE profile_id = caller_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Player statistics not found.');
  END IF;

  -- Check energy
  IF stat_rec.energy < energy_cost THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient energy. Fighting requires ' || energy_cost || ' energy.',
      'energy_remaining', stat_rec.energy
    );
  END IF;

  -- Load battle field details
  SELECT * INTO battle_rec FROM public.battles WHERE id = battle_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Battle field not found.');
  END IF;

  IF battle_rec.status <> 'active' THEN
    RETURN json_build_object('success', false, 'error', 'This battle has already concluded.');
  END IF;

  -- Location verification
  IF profile_rec.current_region_id <> battle_rec.region_id THEN
    RETURN json_build_object('success', false, 'error', 'You are not located in the region where this battle is occurring. Travel there first!');
  END IF;

  -- Weapon weapon check: search for standard Iron Sword (template_id = 2) in inventory
  SELECT * INTO weapon_row 
  FROM public.inventories 
  WHERE owner_id = caller_id AND item_template_id = 2 AND quantity > 0
  LIMIT 1;

  IF FOUND THEN
    weapon_modifier := 1.0 + (weapon_row.quality * 0.2);
    
    -- Consume 1 sword
    UPDATE public.inventories 
    SET quantity = quantity - 1, updated_at = now()
    WHERE id = weapon_row.id;
    
    -- Clean up inventory if quantity is 0
    DELETE FROM public.inventories WHERE id = weapon_row.id AND quantity <= 0;
  ELSE
    weapon_modifier := 1.0;
  END IF;

  -- Damage calculation
  damage := round(base_damage * (1.0 + stat_rec.strength / 100.0) * weapon_modifier);

  -- Update battle wall score
  IF side_country_id = battle_rec.attacker_country_id THEN
    UPDATE public.battles 
    SET attacker_score = attacker_score + damage 
    WHERE id = battle_id;
  ELSE
    UPDATE public.battles 
    SET defender_score = defender_score + damage 
    WHERE id = battle_id;
  END IF;

  -- Update energy and experience
  curr_energy := stat_rec.energy - energy_cost;
  new_exp := stat_rec.experience + xp_gain;
  new_level := stat_rec.level;

  -- Level up loop
  LOOP
    SELECT required_experience INTO required_exp FROM public.experience_tables WHERE level = new_level;
    IF required_exp IS NULL THEN
      EXIT;
    END IF;

    IF new_exp >= required_exp THEN
      new_exp := new_exp - required_exp;
      new_level := new_level + 1;
      leveled_up := TRUE;
      curr_energy := 100;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  -- Commit stats
  UPDATE public.player_stats
  SET 
    level = new_level,
    experience = new_exp,
    energy = curr_energy,
    updated_at = now()
  WHERE profile_id = caller_id;

  -- Record energy history
  INSERT INTO public.energy_history (profile_id, change_amount, reason)
  VALUES (caller_id, -energy_cost, 'combat_fight');

  -- Record audit log
  INSERT INTO public.audit_logs (profile_id, action, metadata)
  VALUES (caller_id, 'combat.fight', jsonb_build_object(
    'battle_id', battle_id,
    'damage_dealt', damage,
    'weapon_used', FOUND,
    'leveled_up', leveled_up
  ));

  RETURN json_build_object(
    'success', true,
    'damage_dealt', damage,
    'xp_gained', xp_gain,
    'energy_remaining', curr_energy,
    'error', null
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', 'Combat transaction aborted: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql;
