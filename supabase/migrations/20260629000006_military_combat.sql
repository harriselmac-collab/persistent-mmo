-- ==========================================
-- PHASE 8: MILITARY SYSTEM & COMBAT ENGINE
-- ==========================================

-- 1. Alter player_stats to support combat attributes
ALTER TABLE public.player_stats 
ADD COLUMN IF NOT EXISTS health INT NOT NULL DEFAULT 100,
ADD COLUMN IF NOT EXISTS max_health INT NOT NULL DEFAULT 100,
ADD COLUMN IF NOT EXISTS defense INT NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS speed INT NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS crit_chance NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS evasion NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS xp_pve BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS level_pve INT NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS pvp_rating INT NOT NULL DEFAULT 1000,
ADD COLUMN IF NOT EXISTS kills INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS deaths INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS damage_dealt BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS damage_taken BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS healing_done BIGINT NOT NULL DEFAULT 0;

-- 2. Regional Wars Battles Table (ensure existence)
CREATE TABLE IF NOT EXISTS public.battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id INT REFERENCES public.regions(id) ON DELETE CASCADE,
  attacker_country_id INT REFERENCES public.countries(id),
  defender_country_id INT REFERENCES public.countries(id),
  attacker_score BIGINT NOT NULL DEFAULT 0,
  defender_score BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'active', -- active, completed
  end_time TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours') NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Seed default battle if not exists so UI always renders war metrics
INSERT INTO public.battles (region_id, attacker_country_id, defender_country_id, attacker_score, defender_score, status)
VALUES (
  2, -- Steel Bastion region
  1, -- Country 1 Attacker
  2, -- Country 2 Defender
  450000,
  550000,
  'active'
)
ON CONFLICT DO NOTHING;

-- 3. Enemy Templates
CREATE TABLE IF NOT EXISTS public.enemy_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  health INT NOT NULL DEFAULT 100,
  attack INT NOT NULL DEFAULT 10,
  defense INT NOT NULL DEFAULT 5,
  speed INT NOT NULL DEFAULT 8,
  xp_reward INT NOT NULL DEFAULT 15,
  currency_reward NUMERIC(20, 2) NOT NULL DEFAULT 5.00,
  spawn_region_id INT REFERENCES public.regions(id) ON DELETE SET NULL,
  difficulty VARCHAR(30) NOT NULL DEFAULT 'standard', -- standard, hard, epic, boss
  ai_profile VARCHAR(50) NOT NULL DEFAULT 'standard'
);

-- 4. Enemy Loot Tables
CREATE TABLE IF NOT EXISTS public.enemy_loot_tables (
  id SERIAL PRIMARY KEY,
  enemy_template_id INT REFERENCES public.enemy_templates(id) ON DELETE CASCADE,
  resource_id INT REFERENCES public.resources(id) ON DELETE CASCADE,
  item_template_id INT REFERENCES public.item_templates(id) ON DELETE CASCADE,
  chance_percent NUMERIC(5, 2) NOT NULL CHECK (chance_percent >= 0 AND chance_percent <= 100),
  min_qty INT NOT NULL DEFAULT 1,
  max_qty INT NOT NULL DEFAULT 1
);

-- 5. Battle Round Logs
CREATE TABLE IF NOT EXISTS public.battle_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID REFERENCES public.battles(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  attacker_name VARCHAR(100) NOT NULL,
  defender_name VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL, -- hit, miss, critical, dodge, block
  damage_dealt INT NOT NULL DEFAULT 0,
  is_critical BOOLEAN NOT NULL DEFAULT false,
  details TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- 6. Player Combat Skills
CREATE TABLE IF NOT EXISTS public.player_combat_skills (
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_name VARCHAR(50) NOT NULL, -- Swordsmanship, Defense, Medicine
  level INT NOT NULL DEFAULT 1,
  xp BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (profile_id, skill_name)
);

-- Seed default enemies
INSERT INTO public.enemy_templates (id, name, health, attack, defense, speed, xp_reward, currency_reward, spawn_region_id, difficulty)
VALUES
  (1, 'Forest Wolf', 50, 10, 4, 12, 10, 3.50, 1, 'standard'),
  (2, 'Highway Bandit', 80, 16, 6, 9, 20, 8.00, 2, 'standard'),
  (3, 'Obsidian Bear', 150, 25, 12, 6, 40, 15.00, 3, 'hard'),
  (4, 'Ancient Skeleton', 120, 22, 18, 10, 50, 20.00, 2, 'hard'),
  (5, 'Colossus Warden (Boss)', 500, 60, 40, 15, 250, 150.00, 3, 'boss')
ON CONFLICT (id) DO UPDATE SET
  health = EXCLUDED.health,
  attack = EXCLUDED.attack,
  defense = EXCLUDED.defense,
  speed = EXCLUDED.speed,
  xp_reward = EXCLUDED.xp_reward,
  currency_reward = EXCLUDED.currency_reward;

-- Seed Enemy Loot Table entries
INSERT INTO public.enemy_loot_tables (enemy_template_id, resource_id, item_template_id, chance_percent, min_qty, max_qty)
VALUES
  (1, 6, NULL, 60.00, 1, 2), -- Wolf drops Fish (Food)
  (1, 10, NULL, 40.00, 1, 3), -- Wolf drops Cotton
  (2, 1, NULL, 50.00, 2, 5), -- Bandit drops Wood
  (2, NULL, 2, 15.00, 1, 1), -- Bandit drops Iron Sword (item template 2)
  (3, 3, NULL, 70.00, 2, 6), -- Bear drops Iron Ore
  (3, NULL, 6, 20.00, 1, 1), -- Bear drops Leather Boots (item template 6)
  (4, 4, NULL, 60.00, 3, 8), -- Skeleton drops Coal
  (4, NULL, 4, 25.00, 1, 1), -- Skeleton drops Helm (item template 4)
  (5, 11, NULL, 100.00, 5, 15), -- Boss drops Steel
  (5, NULL, 7, 50.00, 1, 1) -- Boss drops Steel Pickaxe (item template 7)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.enemy_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enemy_loot_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_combat_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;

-- Setup SELECT permissions (Allow all authenticated users to read)
CREATE POLICY "Allow read battles" ON public.battles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read enemy_templates" ON public.enemy_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read enemy_loot_tables" ON public.enemy_loot_tables FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read battle_rounds" ON public.battle_rounds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read player_combat_skills" ON public.player_combat_skills FOR SELECT TO authenticated USING (true);

-- Override rpc_consume_item to support health_restore
CREATE OR REPLACE FUNCTION public.rpc_consume_item(
  p_item_id UUID
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  item_row RECORD;
  effect_row RECORD;
  energy_restored NUMERIC;
  health_restored NUMERIC;
  new_energy INT;
  new_health INT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  -- Get item detail
  SELECT i.*, t.category_id, c.name AS cat_name, t.name AS item_name
  INTO item_row
  FROM public.inventories i
  JOIN public.item_templates t ON i.item_template_id = t.id
  JOIN public.item_categories c ON t.category_id = c.id
  WHERE i.id = p_item_id AND i.owner_id = caller_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Item not found in inventory.');
  END IF;

  IF item_row.cat_name NOT IN ('Food', 'Drink', 'Medicine') THEN
    RETURN json_build_object('success', false, 'error', 'Item is not a consumable.');
  END IF;

  -- Get energy or health values from attributes
  SELECT COALESCE((SELECT value FROM public.item_template_attributes WHERE template_id = item_row.item_template_id AND attribute_id = (SELECT id FROM public.item_attributes WHERE name = 'energy_restore')), 0) AS energy_val,
         COALESCE((SELECT value FROM public.item_template_attributes WHERE template_id = item_row.item_template_id AND attribute_id = (SELECT id FROM public.item_attributes WHERE name = 'health_restore')), 0) AS health_val
   INTO effect_row;

  energy_restored := effect_row.energy_val;
  health_restored := effect_row.health_val;

  -- Update player stats
  UPDATE public.player_stats
  SET 
    energy = LEAST(100, energy + energy_restored::INT),
    health = LEAST(max_health, health + health_restored::INT)
  WHERE profile_id = caller_id
  RETURNING energy, health INTO new_energy, new_health;

  -- Decrement quantity in inventory
  IF item_row.quantity > 1 THEN
    UPDATE public.inventories SET quantity = quantity - 1 WHERE id = p_item_id;
  ELSE
    DELETE FROM public.inventories WHERE id = p_item_id;
  END IF;

  -- Log action
  INSERT INTO public.item_history (item_instance_id, item_template_id, profile_id, action, quantity, metadata)
  VALUES (item_row.item_instance_id, item_row.item_template_id, caller_id, 'consumed', 1, json_build_object('energy_restored', energy_restored, 'health_restored', health_restored));

  RETURN json_build_object('success', true, 'new_energy', new_energy, 'new_health', new_health, 'error', null);
END;
$$ LANGUAGE plpgsql;

-- Stored Procedure: execute_pve_battle (Server Authoritative Damage Engine)
CREATE OR REPLACE FUNCTION public.rpc_execute_pve_battle(
  p_enemy_template_id INT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  caller_stats RECORD;
  enemy_stats RECORD;
  equip_row RECORD;
  loot_row RECORD;
  
  p_dmg INT;
  e_dmg INT;
  p_hp INT;
  e_hp INT;
  round_idx INT := 1;
  p_initiative BOOLEAN;
  
  -- Combat calculation variables
  p_atk INT := 10;
  p_def INT := 5;
  p_spd INT := 10;
  
  is_crit BOOLEAN;
  dmg_dealt INT;
  
  loot_gained JSONB := '[]'::jsonb;
  xp_won INT;
  gold_won NUMERIC(20, 2);
  battle_id UUID;
  rounds_json JSONB := '[]'::jsonb;
  qty INT;
  inst_id UUID;
BEGIN
  -- 1. Authenticate user
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized player session.');
  END IF;

  -- 2. Load stats & check energy/health
  SELECT * INTO caller_stats FROM public.player_stats WHERE profile_id = caller_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Stats profile not found.');
  END IF;

  IF caller_stats.energy < 10 THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient energy. Fights require 10 EP.');
  END IF;

  IF caller_stats.health <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'You are currently knocked out. Eat Bread or use Medicine to heal.');
  END IF;

  -- 3. Load Enemy Template parameters
  SELECT * INTO enemy_stats FROM public.enemy_templates WHERE id = p_enemy_template_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Enemy template not found.');
  END IF;

  -- 4. Calculate Player Combat modifiers based on equipment durability
  SELECT * INTO equip_row FROM public.equipment WHERE profile_id = caller_id;
  IF FOUND THEN
    -- Weapon Attack bonus
    IF equip_row.weapon_id IS NOT NULL THEN
      SELECT COALESCE(ta.value, 0)::int INTO p_dmg 
      FROM public.inventories i
      JOIN public.item_template_attributes ta ON ta.template_id = i.item_template_id
      JOIN public.item_attributes a ON a.id = ta.attribute_id
      JOIN public.item_instances inst ON inst.id = i.item_instance_id
      WHERE i.id = equip_row.weapon_id AND a.name = 'attack' AND inst.durability > 0;
      
      IF p_dmg IS NOT NULL THEN
        p_atk := p_atk + p_dmg;
      END IF;
    END IF;

    -- Chest Armor Defense bonus
    IF equip_row.chest_id IS NOT NULL THEN
      SELECT COALESCE(ta.value, 0)::int INTO p_dmg 
      FROM public.inventories i
      JOIN public.item_template_attributes ta ON ta.template_id = i.item_template_id
      JOIN public.item_attributes a ON a.id = ta.attribute_id
      JOIN public.item_instances inst ON inst.id = i.item_instance_id
      WHERE i.id = equip_row.chest_id AND a.name = 'defense' AND inst.durability > 0;
      
      IF p_dmg IS NOT NULL THEN
        p_def := p_def + p_dmg;
      END IF;
    END IF;

    -- Helm Armor Defense bonus
    IF equip_row.helmet_id IS NOT NULL THEN
      SELECT COALESCE(ta.value, 0)::int INTO p_dmg 
      FROM public.inventories i
      JOIN public.item_template_attributes ta ON ta.template_id = i.item_template_id
      JOIN public.item_attributes a ON a.id = ta.attribute_id
      JOIN public.item_instances inst ON inst.id = i.item_instance_id
      WHERE i.id = equip_row.helmet_id AND a.name = 'defense' AND inst.durability > 0;
      
      IF p_dmg IS NOT NULL THEN
        p_def := p_def + p_dmg;
      END IF;
    END IF;
  END IF;

  -- Add base strength modifier
  p_atk := p_atk + floor(caller_stats.strength * 1.5)::int;
  
  -- Initiatives speed checking
  p_initiative := (p_spd >= enemy_stats.speed);

  p_hp := caller_stats.health;
  e_hp := enemy_stats.health;

  -- 5. Turn Simulation Loops
  WHILE p_hp > 0 AND e_hp > 0 AND round_idx <= 20 LOOP
    -- Player Turn
    IF p_initiative THEN
      -- Hit/Crit roll
      is_crit := ((random() * 100) <= caller_stats.crit_chance);
      dmg_dealt := greatest(1, p_atk - enemy_stats.defense);
      IF is_crit THEN
        dmg_dealt := dmg_dealt * 2;
      END IF;
      
      e_hp := greatest(0, e_hp - dmg_dealt);
      rounds_json := rounds_json || jsonb_build_object(
        'round', round_idx,
        'attacker', 'Player',
        'defender', enemy_stats.name,
        'action', CASE WHEN is_crit THEN 'critical' ELSE 'hit' END,
        'damage', dmg_dealt,
        'defender_hp', e_hp
      );
      
      IF e_hp <= 0 THEN
        EXIT;
      END IF;
    END IF;

    -- Enemy Turn
    is_crit := ((random() * 100) <= 5.00); -- 5% base enemy crit chance
    dmg_dealt := greatest(1, enemy_stats.attack - p_def);
    IF is_crit THEN
      dmg_dealt := dmg_dealt * 2;
    END IF;

    p_hp := greatest(0, p_hp - dmg_dealt);
    rounds_json := rounds_json || jsonb_build_object(
      'round', round_idx,
      'attacker', enemy_stats.name,
      'defender', 'Player',
      'action', CASE WHEN is_crit THEN 'critical' ELSE 'hit' END,
      'damage', dmg_dealt,
      'defender_hp', p_hp
    );

    IF p_hp <= 0 THEN
      EXIT;
    END IF;

    -- Player Turn (if enemy had initiative)
    IF NOT p_initiative THEN
      is_crit := ((random() * 100) <= caller_stats.crit_chance);
      dmg_dealt := greatest(1, p_atk - enemy_stats.defense);
      IF is_crit THEN
        dmg_dealt := dmg_dealt * 2;
      END IF;
      
      e_hp := greatest(0, e_hp - dmg_dealt);
      rounds_json := rounds_json || jsonb_build_object(
        'round', round_idx,
        'attacker', 'Player',
        'defender', enemy_stats.name,
        'action', CASE WHEN is_crit THEN 'critical' ELSE 'hit' END,
        'damage', dmg_dealt,
        'defender_hp', e_hp
      );
    END IF;

    round_idx := round_idx + 1;
  END LOOP;

  -- 6. Battle Outcome processing
  -- Deduct Energy cost
  UPDATE public.player_stats 
  SET energy = energy - 10,
      health = p_hp,
      damage_dealt = damage_dealt + (enemy_stats.health - e_hp),
      damage_taken = damage_taken + (caller_stats.health - p_hp)
  WHERE profile_id = caller_id;

  IF e_hp <= 0 THEN
    -- VICTORY
    xp_won := enemy_stats.xp_reward;
    gold_won := enemy_stats.currency_reward;

    -- Update Currency balances
    UPDATE public.currencies SET local_currency_balance = local_currency_balance + gold_won WHERE profile_id = caller_id;

    -- Update statistics & level checks
    UPDATE public.player_stats 
    SET xp_pve = xp_pve + xp_won,
        kills = kills + 1
    WHERE profile_id = caller_id;

    -- Inflict Durability loss on equipped gears (reduces by 5 points)
    IF equip_row.weapon_id IS NOT NULL THEN
      UPDATE public.item_instances 
      SET durability = greatest(0, durability - 5)
      WHERE id = (SELECT item_instance_id FROM public.inventories WHERE id = equip_row.weapon_id);
    END IF;

    IF equip_row.chest_id IS NOT NULL THEN
      UPDATE public.item_instances 
      SET durability = greatest(0, durability - 5)
      WHERE id = (SELECT item_instance_id FROM public.inventories WHERE id = equip_row.chest_id);
    END IF;

    -- Roll loot drops from tables
    FOR loot_row IN SELECT * FROM public.enemy_loot_tables WHERE enemy_template_id = p_enemy_template_id LOOP
      IF (random() * 100) <= loot_row.chance_percent THEN
        qty := floor(loot_row.min_qty + random() * (loot_row.max_qty - loot_row.min_qty + 1))::int;
        IF loot_row.resource_id IS NOT NULL THEN
          -- Award resource stack
          INSERT INTO public.player_resources (profile_id, resource_id, quantity)
          VALUES (caller_id, loot_row.resource_id, qty)
          ON CONFLICT (profile_id, resource_id) DO UPDATE 
          SET quantity = public.player_resources.quantity + qty;
          
          loot_gained := loot_gained || jsonb_build_object(
            'type', 'resource',
            'id', loot_row.resource_id,
            'quantity', qty,
            'name', (SELECT name FROM public.resources WHERE id = loot_row.resource_id)
          );
        ELSIF loot_row.item_template_id IS NOT NULL THEN
          -- Award item instance
          INSERT INTO public.item_instances (item_template_id, durability, max_durability, quality)
          VALUES (loot_row.item_template_id, 100, 100, 1)
          RETURNING id INTO inst_id;

          INSERT INTO public.inventories (owner_id, item_template_id, item_instance_id, quantity)
          VALUES (caller_id, loot_row.item_template_id, inst_id, qty);
          
          loot_gained := loot_gained || jsonb_build_object(
            'type', 'item',
            'id', loot_row.item_template_id,
            'quantity', qty,
            'name', (SELECT name FROM public.item_templates WHERE id = loot_row.item_template_id)
          );
        END IF;
      END IF;
    END LOOP;

    RETURN jsonb_build_object(
      'success', true,
      'is_victory', true,
      'xp_gained', xp_won,
      'currency_gained', gold_won,
      'rounds_log', rounds_json,
      'loot_gained', loot_gained,
      'player_hp', p_hp
    );
  ELSE
    -- DEFEAT
    UPDATE public.player_stats 
    SET deaths = deaths + 1,
        health = 0
    WHERE profile_id = caller_id;

    RETURN jsonb_build_object(
      'success', true,
      'is_victory', false,
      'xp_gained', 0,
      'currency_gained', 0,
      'rounds_log', rounds_json,
      'loot_gained', '[]'::jsonb,
      'player_hp', 0
    );
  END IF;
END;
$$ LANGUAGE plpgsql;


-- Stored Procedure: execute_pvp_battle (Ranked Arena combat duels)
CREATE OR REPLACE FUNCTION public.rpc_execute_pvp_battle(
  p_opponent_profile_id UUID
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  c_stats RECORD;
  o_stats RECORD;
  
  c_hp INT;
  o_hp INT;
  round_idx INT := 1;
  c_init BOOLEAN;
  
  c_atk INT := 12;
  c_def INT := 5;
  o_atk INT := 12;
  o_def INT := 5;
  
  is_crit BOOLEAN;
  dmg_dealt INT;
  
  c_rating_change INT := 25;
  o_rating_change INT := 25;
  rounds_json JSONB := '[]'::jsonb;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  IF caller_id = p_opponent_profile_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot duel yourself in the arena.');
  END IF;

  -- Load stats
  SELECT * INTO c_stats FROM public.player_stats WHERE profile_id = caller_id FOR UPDATE;
  SELECT * INTO o_stats FROM public.player_stats WHERE profile_id = p_opponent_profile_id FOR UPDATE;

  IF c_stats.energy < 10 THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient energy. PvP fights require 10 EP.');
  END IF;

  IF c_stats.health <= 0 OR o_stats.health <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Both players must be conscious and have > 0 HP to battle.');
  END IF;

  -- Base stats modifications
  c_atk := c_atk + floor(c_stats.strength * 1.5)::int;
  o_atk := o_atk + floor(o_stats.strength * 1.5)::int;

  c_hp := c_stats.health;
  o_hp := o_stats.health;
  c_init := (c_stats.speed >= o_stats.speed);

  -- Sim loop
  WHILE c_hp > 0 AND o_hp > 0 AND round_idx <= 20 LOOP
    -- Caller hits opponent
    IF c_init THEN
      is_crit := ((random() * 100) <= c_stats.crit_chance);
      dmg_dealt := greatest(1, c_atk - o_def);
      IF is_crit THEN dmg_dealt := dmg_dealt * 2; END IF;
      
      o_hp := greatest(0, o_hp - dmg_dealt);
      rounds_json := rounds_json || jsonb_build_object(
        'round', round_idx,
        'attacker', 'You',
        'defender', 'Opponent',
        'action', CASE WHEN is_crit THEN 'critical' ELSE 'hit' END,
        'damage', dmg_dealt,
        'defender_hp', o_hp
      );
      
      IF o_hp <= 0 THEN EXIT; END IF;
    END IF;

    -- Opponent hits caller
    is_crit := ((random() * 100) <= o_stats.crit_chance);
    dmg_dealt := greatest(1, o_atk - c_def);
    IF is_crit THEN dmg_dealt := dmg_dealt * 2; END IF;

    c_hp := greatest(0, c_hp - dmg_dealt);
    rounds_json := rounds_json || jsonb_build_object(
      'round', round_idx,
      'attacker', 'Opponent',
      'defender', 'You',
      'action', CASE WHEN is_crit THEN 'critical' ELSE 'hit' END,
      'damage', dmg_dealt,
      'defender_hp', c_hp
    );

    IF c_hp <= 0 THEN EXIT; END IF;

    -- Caller hits opponent (if opponent had speed initiative)
    IF NOT c_init THEN
      is_crit := ((random() * 100) <= c_stats.crit_chance);
      dmg_dealt := greatest(1, c_atk - o_def);
      IF is_crit THEN dmg_dealt := dmg_dealt * 2; END IF;
      
      o_hp := greatest(0, o_hp - dmg_dealt);
      rounds_json := rounds_json || jsonb_build_object(
        'round', round_idx,
        'attacker', 'You',
        'defender', 'Opponent',
        'action', CASE WHEN is_crit THEN 'critical' ELSE 'hit' END,
        'damage', dmg_dealt,
        'defender_hp', o_hp
      );
    END IF;

    round_idx := round_idx + 1;
  END LOOP;

  -- Energy costs and stat updates
  UPDATE public.player_stats 
  SET energy = energy - 10,
      health = c_hp
  WHERE profile_id = caller_id;

  UPDATE public.player_stats 
  SET health = o_hp
  WHERE profile_id = p_opponent_profile_id;

  IF o_hp <= 0 THEN
    -- Caller won
    UPDATE public.player_stats 
    SET pvp_rating = pvp_rating + c_rating_change,
        kills = kills + 1
    WHERE profile_id = caller_id;

    UPDATE public.player_stats 
    SET pvp_rating = greatest(100, pvp_rating - o_rating_change),
        deaths = deaths + 1
    WHERE profile_id = p_opponent_profile_id;

    RETURN jsonb_build_object(
      'success', true,
      'is_victory', true,
      'rounds_log', rounds_json,
      'rating_change', c_rating_change,
      'player_hp', c_hp
    );
  ELSE
    -- Opponent won
    UPDATE public.player_stats 
    SET pvp_rating = greatest(100, pvp_rating - c_rating_change),
        deaths = deaths + 1
    WHERE profile_id = caller_id;

    UPDATE public.player_stats 
    SET pvp_rating = pvp_rating + o_rating_change,
        kills = kills + 1
    WHERE profile_id = p_opponent_profile_id;

    RETURN jsonb_build_object(
      'success', true,
      'is_victory', false,
      'rounds_log', rounds_json,
      'rating_change', -c_rating_change,
      'player_hp', 0
    );
  END IF;
END;
$$ LANGUAGE plpgsql;
