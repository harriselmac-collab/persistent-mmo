-- ========================================================
-- PHASE 6: UNIVERSAL ITEM SYSTEM, EQUIPMENT & CRAFTING SCHEMA
-- ========================================================

-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS public.item_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Seed configurable categories
INSERT INTO public.item_categories (name, description) VALUES
  ('Raw Resource', 'Raw gatherable commodities'),
  ('Refined Resource', 'Refined materials manufactured in factories'),
  ('Food', 'Edible sustenance that restores energy'),
  ('Drink', 'Beverages that restore energy and statistics'),
  ('Medicine', 'Healing compounds restoring health and stats'),
  ('Weapon', 'Main-hand combat offensive tools'),
  ('Armor', 'Chest pieces providing defensive ratings'),
  ('Shield', 'Off-hand items providing block rating'),
  ('Helmet', 'Head gear items protecting the skull'),
  ('Boots', 'Footwear providing armor and speed'),
  ('Gloves', 'Hand gear providing crafting and defensive stats'),
  ('Backpack', 'Containers increasing inventory capacity'),
  ('Tool', 'Mining or harvesting utility instruments'),
  ('Machine', 'Industrial factory components'),
  ('Vehicle', 'Logistics vehicles reducing travel cooldowns'),
  ('Ticket', 'Travel passes or licensing keys'),
  ('Blueprint', 'Collectible recipes unlocking new crafting structures'),
  ('Quest Item', 'Mission and story items'),
  ('Collectible', 'Rare commemorative achievements or trophies'),
  ('Cosmetic', 'Visual custom skins or effects'),
  ('Government', 'State licenses, bonds, or passes')
ON CONFLICT (name) DO NOTHING;

-- 2. Create Item Templates Table
CREATE TABLE IF NOT EXISTS public.item_templates (
  id SERIAL PRIMARY KEY,
  category_id INT REFERENCES public.item_categories(id) ON DELETE RESTRICT,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  base_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  weight NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  max_durability INT NOT NULL DEFAULT 100,
  rarity VARCHAR(30) NOT NULL DEFAULT 'common', -- common, uncommon, rare, epic, legendary, unique, developer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Seed item templates
INSERT INTO public.item_templates (id, category_id, name, description, base_value, weight, max_durability, rarity) VALUES
  (1, (SELECT id FROM public.item_categories WHERE name = 'Food'), 'Wheat Bread', 'Crispy oven-baked loaf. Restores 10 energy.', 5.00, 0.10, 0, 'common'),
  (2, (SELECT id FROM public.item_categories WHERE name = 'Weapon'), 'Iron Sword', 'Standard-issue military sword.', 50.00, 2.50, 100, 'common'),
  (3, (SELECT id FROM public.item_categories WHERE name = 'Ticket'), 'Travel Ticket', 'Genesis Airlines inter-country single-use pass.', 20.00, 0.01, 0, 'common'),
  (4, (SELECT id FROM public.item_categories WHERE name = 'Helmet'), 'Iron Plate Helm', 'Heavy iron defense crown.', 35.00, 1.80, 120, 'common'),
  (5, (SELECT id FROM public.item_categories WHERE name = 'Armor'), 'Iron Plate Chest', 'Full body protective iron coating.', 90.00, 5.00, 150, 'common'),
  (6, (SELECT id FROM public.item_categories WHERE name = 'Boots'), 'Leather Boots', 'Soft leather speed shoes.', 25.00, 0.90, 80, 'common'),
  (7, (SELECT id FROM public.item_categories WHERE name = 'Tool'), 'Steel Pickaxe', 'Advanced mining pick improving harvest speeds.', 60.00, 3.00, 200, 'uncommon')
ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_value = EXCLUDED.base_value,
  weight = EXCLUDED.weight,
  max_durability = EXCLUDED.max_durability,
  rarity = EXCLUDED.rarity;

-- Adjust SERIAL sequence to prevent key collisions
SELECT setval('public.item_templates_id_seq', COALESCE((SELECT MAX(id)+1 FROM public.item_templates), 1), false);

-- 3. Create Attributes Table
CREATE TABLE IF NOT EXISTS public.item_attributes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Seed core attributes
INSERT INTO public.item_attributes (name, display_name, description) VALUES
  ('attack', 'Attack Rating', 'Increases physical damage in combat'),
  ('defense', 'Defense Rating', 'Reduces incoming physical damage'),
  ('health', 'Health Bonus', 'Adds to maximum health points'),
  ('speed', 'Speed Multiplier', 'Increases travel and shift recovery speeds'),
  ('mining_bonus', 'Mining Efficiency', 'Increases resources gathered from mining'),
  ('crafting_bonus', 'Crafting Speed', 'Decreases item production queuing time'),
  ('energy_restore', 'Energy Restore', 'Instantly restores energy on use'),
  ('health_restore', 'Health Restore', 'Instantly restores health on use')
ON CONFLICT (name) DO NOTHING;

-- 4. Create Template Attributes Mapping Table
CREATE TABLE IF NOT EXISTS public.item_template_attributes (
  template_id INT REFERENCES public.item_templates(id) ON DELETE CASCADE,
  attribute_id INT REFERENCES public.item_attributes(id) ON DELETE CASCADE,
  value NUMERIC(15, 4) NOT NULL,
  PRIMARY KEY (template_id, attribute_id)
);

-- Seed base stats for items
INSERT INTO public.item_template_attributes (template_id, attribute_id, value) VALUES
  (1, (SELECT id FROM public.item_attributes WHERE name = 'energy_restore'), 10.0000),
  (2, (SELECT id FROM public.item_attributes WHERE name = 'attack'), 20.0000),
  (4, (SELECT id FROM public.item_attributes WHERE name = 'defense'), 8.0000),
  (5, (SELECT id FROM public.item_attributes WHERE name = 'defense'), 25.0000),
  (6, (SELECT id FROM public.item_attributes WHERE name = 'speed'), 0.0500),
  (7, (SELECT id FROM public.item_attributes WHERE name = 'mining_bonus'), 0.1500)
ON CONFLICT DO NOTHING;

-- 5. Create Item Instances Table
CREATE TABLE IF NOT EXISTS public.item_instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id INT REFERENCES public.item_templates(id) ON DELETE CASCADE NOT NULL,
  quality INT NOT NULL DEFAULT 1 CHECK (quality >= 1 AND quality <= 7), -- 1: Poor, 2: Common, 3: Uncommon, 4: Rare, 5: Epic, 6: Legendary, 7: Mythic
  current_durability INT NOT NULL DEFAULT 100,
  max_durability INT NOT NULL DEFAULT 100,
  enchantment_level INT NOT NULL DEFAULT 0,
  sockets_json JSONB DEFAULT '[]'::jsonb, -- gems/runes
  modifiers_json JSONB DEFAULT '[]'::jsonb, -- prefixes/suffixes
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- 6. Modify Inventories Table to reference Instances
ALTER TABLE public.inventories
ADD COLUMN IF NOT EXISTS item_instance_id UUID REFERENCES public.item_instances(id) ON DELETE SET NULL;

-- Re-architect Unique Constraints on Inventories to handle stackable resources vs unique instances
ALTER TABLE public.inventories DROP CONSTRAINT IF EXISTS uq_owner_template_quality;

CREATE UNIQUE INDEX IF NOT EXISTS uq_owner_template_quality_no_instance 
ON public.inventories(owner_id, item_template_id, quality) 
WHERE (item_instance_id IS NULL);

CREATE UNIQUE INDEX IF NOT EXISTS uq_inventories_instance 
ON public.inventories(item_instance_id) 
WHERE (item_instance_id IS NOT NULL);

-- 7. Extend Equipment slots
ALTER TABLE public.equipment
ADD COLUMN IF NOT EXISTS helmet_id UUID REFERENCES public.inventories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS chest_id UUID REFERENCES public.inventories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS legs_id UUID REFERENCES public.inventories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS boots_id UUID REFERENCES public.inventories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS gloves_id UUID REFERENCES public.inventories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS shield_id UUID REFERENCES public.inventories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ring_id UUID REFERENCES public.inventories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS necklace_id UUID REFERENCES public.inventories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS backpack_id UUID REFERENCES public.inventories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS accessory_id UUID REFERENCES public.inventories(id) ON DELETE SET NULL;

-- 8. Crafting Recipes
CREATE TABLE IF NOT EXISTS public.item_recipes (
  id SERIAL PRIMARY KEY,
  result_template_id INT REFERENCES public.item_templates(id) ON DELETE CASCADE NOT NULL,
  result_quantity INT NOT NULL DEFAULT 1,
  craft_time INT NOT NULL DEFAULT 5, -- seconds
  energy_cost INT NOT NULL DEFAULT 5,
  required_level INT NOT NULL DEFAULT 1,
  experience_reward INT NOT NULL DEFAULT 10,
  failure_chance NUMERIC(5, 4) DEFAULT 0.0000, -- e.g. 0.05 for 5%
  is_blueprint_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Ingredients mapping table
CREATE TABLE IF NOT EXISTS public.item_recipe_inputs (
  id SERIAL PRIMARY KEY,
  recipe_id INT REFERENCES public.item_recipes(id) ON DELETE CASCADE NOT NULL,
  resource_id INT REFERENCES public.resources(id) ON DELETE CASCADE,
  item_template_id INT REFERENCES public.item_templates(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  UNIQUE (recipe_id, resource_id, item_template_id)
);

-- Persisted unlocked blueprints
CREATE TABLE IF NOT EXISTS public.item_blueprints (
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipe_id INT REFERENCES public.item_recipes(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  PRIMARY KEY (profile_id, recipe_id)
);

-- Seed Crafting Recipes
-- Recipe 1: Wheat Bread (Result: template 1, qty 1, Level 1. Costs 2 Grain (res 5) + 1 Water (res 7))
INSERT INTO public.item_recipes (id, result_template_id, result_quantity, craft_time, energy_cost, required_level, experience_reward, failure_chance, is_blueprint_required) VALUES
  (1, 1, 1, 4, 5, 1, 10, 0.0000, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.item_recipe_inputs (recipe_id, resource_id, item_template_id, quantity) VALUES
  (1, 5, null, 2),
  (1, 7, null, 1)
ON CONFLICT DO NOTHING;

-- Recipe 2: Iron Sword (Result: template 2, qty 1, Level 2. Costs 5 Iron Bar (res 12) + 1 Coal (res 4). Blueprint REQUIRED)
INSERT INTO public.item_recipes (id, result_template_id, result_quantity, craft_time, energy_cost, required_level, experience_reward, failure_chance, is_blueprint_required) VALUES
  (2, 2, 1, 10, 15, 2, 40, 0.0500, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.item_recipe_inputs (recipe_id, resource_id, item_template_id, quantity) VALUES
  (2, 12, null, 5),
  (2, 4, null, 1)
ON CONFLICT DO NOTHING;

-- Adjust SERIAL sequence for recipes
SELECT setval('public.item_recipes_id_seq', COALESCE((SELECT MAX(id)+1 FROM public.item_recipes), 1), false);

-- 9. Sets & Forensic Trail
CREATE TABLE IF NOT EXISTS public.item_sets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.item_set_templates (
  set_id INT REFERENCES public.item_sets(id) ON DELETE CASCADE,
  template_id INT REFERENCES public.item_templates(id) ON DELETE CASCADE,
  PRIMARY KEY (set_id, template_id)
);

CREATE TABLE IF NOT EXISTS public.item_set_bonuses (
  set_id INT REFERENCES public.item_sets(id) ON DELETE CASCADE,
  pieces_required INT NOT NULL,
  attribute_id INT REFERENCES public.item_attributes(id) ON DELETE CASCADE,
  value NUMERIC(15, 4) NOT NULL,
  PRIMARY KEY (set_id, pieces_required, attribute_id)
);

CREATE TABLE IF NOT EXISTS public.item_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_instance_id UUID,
  item_template_id INT NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- created, crafted, sold, equipped, repaired, consumed, destroyed
  quantity INT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- ========================================================
-- RLS POLICIES FOR NEW TABLES
-- ========================================================
ALTER TABLE public.item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_template_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_recipe_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_set_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_set_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_categories ON public.item_categories FOR SELECT USING (true);
CREATE POLICY select_templates ON public.item_templates FOR SELECT USING (true);
CREATE POLICY select_attributes ON public.item_attributes FOR SELECT USING (true);
CREATE POLICY select_template_attrs ON public.item_template_attributes FOR SELECT USING (true);
CREATE POLICY select_instances ON public.item_instances FOR SELECT USING (true);
CREATE POLICY select_recipes ON public.item_recipes FOR SELECT USING (true);
CREATE POLICY select_recipe_inputs ON public.item_recipe_inputs FOR SELECT USING (true);
CREATE POLICY select_blueprints ON public.item_blueprints FOR SELECT USING (true);
CREATE POLICY select_sets ON public.item_sets FOR SELECT USING (true);
CREATE POLICY select_set_templates ON public.item_set_templates FOR SELECT USING (true);
CREATE POLICY select_set_bonuses ON public.item_set_bonuses FOR SELECT USING (true);
CREATE POLICY select_history ON public.item_history FOR SELECT USING (true);

-- Allow users to manage their own blueprints
CREATE POLICY manage_my_blueprints ON public.item_blueprints
  FOR ALL USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- Allow users to read/write item history for their profile
CREATE POLICY manage_my_item_history ON public.item_history
  FOR ALL USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- ========================================================
-- STORED PROCEDURES (RPC METHOD BINDINGS)
-- ========================================================

-- A. RPC Equip Item
CREATE OR REPLACE FUNCTION public.rpc_equip_item(
  p_item_id UUID,
  p_slot VARCHAR
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  item_row RECORD;
  current_equip RECORD;
  slot_col TEXT;
  sql_query TEXT;
  stats_row RECORD;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  -- 1. Verify item exists and is owned by caller
  SELECT i.*, t.category_id, c.name AS cat_name, t.rarity, t.max_durability, t.name AS item_name
  INTO item_row
  FROM public.inventories i
  JOIN public.item_templates t ON i.item_template_id = t.id
  JOIN public.item_categories c ON t.category_id = c.id
  WHERE i.id = p_item_id AND i.owner_id = caller_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Item not found in inventory.');
  END IF;

  -- 2. Verify level requirements
  SELECT * INTO stats_row FROM public.player_stats WHERE profile_id = caller_id;

  -- 3. Match slots
  slot_col := CASE p_slot
    WHEN 'helmet' THEN 'helmet_id'
    WHEN 'chest' THEN 'chest_id'
    WHEN 'legs' THEN 'legs_id'
    WHEN 'boots' THEN 'boots_id'
    WHEN 'gloves' THEN 'gloves_id'
    WHEN 'weapon' THEN 'weapon_id'
    WHEN 'shield' THEN 'shield_id'
    WHEN 'ring' THEN 'ring_id'
    WHEN 'necklace' THEN 'necklace_id'
    WHEN 'backpack' THEN 'backpack_id'
    WHEN 'accessory' THEN 'accessory_id'
    ELSE NULL
  END;

  IF slot_col IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid equipment slot.');
  END IF;

  -- 4. Unequip any current item in that slot
  SELECT * INTO current_equip FROM public.equipment WHERE profile_id = caller_id;
  
  -- Perform slot binding update dynamically
  EXECUTE format('UPDATE public.equipment SET %I = $1 WHERE profile_id = $2', slot_col)
  USING p_item_id, caller_id;

  -- Log action
  INSERT INTO public.item_history (item_instance_id, item_template_id, profile_id, action, quantity, metadata)
  VALUES (item_row.item_instance_id, item_row.item_template_id, caller_id, 'equipped', 1, json_build_object('slot', p_slot));

  RETURN json_build_object('success', true, 'error', null);
END;
$$ LANGUAGE plpgsql;


-- B. RPC Unequip Item
CREATE OR REPLACE FUNCTION public.rpc_unequip_item(
  p_slot VARCHAR
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  slot_col TEXT;
  equipped_item_id UUID;
  item_row RECORD;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  slot_col := CASE p_slot
    WHEN 'helmet' THEN 'helmet_id'
    WHEN 'chest' THEN 'chest_id'
    WHEN 'legs' THEN 'legs_id'
    WHEN 'boots' THEN 'boots_id'
    WHEN 'gloves' THEN 'gloves_id'
    WHEN 'weapon' THEN 'weapon_id'
    WHEN 'shield' THEN 'shield_id'
    WHEN 'ring' THEN 'ring_id'
    WHEN 'necklace' THEN 'necklace_id'
    WHEN 'backpack' THEN 'backpack_id'
    WHEN 'accessory' THEN 'accessory_id'
    ELSE NULL
  END;

  IF slot_col IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid equipment slot.');
  END IF;

  -- Retrieve currently equipped item
  EXECUTE format('SELECT %I FROM public.equipment WHERE profile_id = $1', slot_col)
  INTO equipped_item_id
  USING caller_id;

  IF equipped_item_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No item equipped in this slot.');
  END IF;

  -- Remove binding
  EXECUTE format('UPDATE public.equipment SET %I = NULL WHERE profile_id = $1', slot_col)
  USING caller_id;

  -- Fetch templates detail to log
  SELECT * INTO item_row FROM public.inventories WHERE id = equipped_item_id;

  -- Log action
  IF FOUND THEN
    INSERT INTO public.item_history (item_instance_id, item_template_id, profile_id, action, quantity, metadata)
    VALUES (item_row.item_instance_id, item_row.item_template_id, caller_id, 'unequipped', 1, json_build_object('slot', p_slot));
  END IF;

  RETURN json_build_object('success', true, 'error', null);
END;
$$ LANGUAGE plpgsql;


-- C. RPC Consume Item
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
    energy = LEAST(100, energy + energy_restored::INT)
  WHERE profile_id = caller_id
  RETURNING energy INTO new_energy;

  -- Decrement quantity in inventory
  IF item_row.quantity > 1 THEN
    UPDATE public.inventories SET quantity = quantity - 1 WHERE id = p_item_id;
  ELSE
    DELETE FROM public.inventories WHERE id = p_item_id;
  END IF;

  -- Log action
  INSERT INTO public.item_history (item_instance_id, item_template_id, profile_id, action, quantity, metadata)
  VALUES (item_row.item_instance_id, item_row.item_template_id, caller_id, 'consumed', 1, json_build_object('energy_restored', energy_restored, 'health_restored', health_restored));

  RETURN json_build_object('success', true, 'new_energy', new_energy, 'error', null);
END;
$$ LANGUAGE plpgsql;


-- D. RPC Unlock Blueprint
CREATE OR REPLACE FUNCTION public.rpc_unlock_blueprint(
  p_recipe_id INT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  recipe_row RECORD;
  blueprint_item RECORD;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  -- Find recipe
  SELECT * INTO recipe_row FROM public.item_recipes WHERE id = p_recipe_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Recipe not found.');
  END IF;

  -- Verify user has the blueprint item in inventory (representing the token they want to consume)
  -- Blueprints are items with category 'Blueprint' and metadata pointing to the recipe_id
  SELECT i.* FROM public.inventories i
  JOIN public.item_templates t ON i.item_template_id = t.id
  JOIN public.item_categories c ON t.category_id = c.id
  WHERE i.owner_id = caller_id AND c.name = 'Blueprint' AND i.item_template_id = recipe_row.result_template_id
  INTO blueprint_item;

  -- Check if already unlocked
  PERFORM 1 FROM public.item_blueprints WHERE profile_id = caller_id AND recipe_id = p_recipe_id;
  IF FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Recipe blueprint already unlocked.');
  END IF;

  -- Insert persistent unlock record
  INSERT INTO public.item_blueprints (profile_id, recipe_id)
  VALUES (caller_id, p_recipe_id);

  RETURN json_build_object('success', true, 'error', null);
END;
$$ LANGUAGE plpgsql;


-- E. RPC Repair Item
CREATE OR REPLACE FUNCTION public.rpc_repair_item(
  p_item_id UUID
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  inventory_row RECORD;
  instance_row RECORD;
  repair_cost NUMERIC;
  wallet RECORD;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  -- Retrieve inventory row
  SELECT * INTO inventory_row FROM public.inventories WHERE id = p_item_id AND owner_id = caller_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Item not found in inventory.');
  END IF;

  IF inventory_row.item_instance_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Selected item is not a repairable unique instance.');
  END IF;

  -- Fetch instance durability
  SELECT * INTO instance_row FROM public.item_instances WHERE id = inventory_row.item_instance_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Item instance data is missing.');
  END IF;

  IF instance_row.current_durability = instance_row.max_durability THEN
    RETURN json_build_object('success', false, 'error', 'Item is already at full durability.');
  END IF;

  -- Calculate repair cost (1.5 LC per missing durability point)
  repair_cost := (instance_row.max_durability - instance_row.current_durability) * 1.50;

  -- Check player wallet
  SELECT * INTO wallet FROM public.currencies WHERE profile_id = caller_id FOR UPDATE;
  IF wallet.local_currency_balance < repair_cost THEN
    RETURN json_build_object('success', false, 'error', format('Insufficient funds for repair. Requires %s LC.', repair_cost));
  END IF;

  -- Deduct money
  UPDATE public.currencies
  SET local_currency_balance = local_currency_balance - repair_cost
  WHERE profile_id = caller_id;

  -- Restore durability
  UPDATE public.item_instances
  SET current_durability = max_durability
  WHERE id = inventory_row.item_instance_id;

  -- Log action
  INSERT INTO public.item_history (item_instance_id, item_template_id, profile_id, action, quantity, metadata)
  VALUES (inventory_row.item_instance_id, inventory_row.item_template_id, caller_id, 'repaired', 1, json_build_object('cost', repair_cost));

  RETURN json_build_object('success', true, 'cost_paid', repair_cost, 'error', null);
END;
$$ LANGUAGE plpgsql;


-- F. RPC Craft Item
CREATE OR REPLACE FUNCTION public.rpc_craft_item(
  p_recipe_id INT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = path, public
AS $$
DECLARE
  caller_id UUID;
  recipe_row RECORD;
  stats_row RECORD;
  ingredient_row RECORD;
  new_instance_id UUID;
  has_ingredients BOOLEAN;
  new_quality INT;
  crit_roll NUMERIC;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  -- 1. Fetch recipe
  SELECT r.*, t.max_durability, t.name AS item_name, t.rarity
  INTO recipe_row
  FROM public.item_recipes r
  JOIN public.item_templates t ON r.result_template_id = t.id
  WHERE r.id = p_recipe_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Recipe not found.');
  END IF;

  -- 2. Check level requirements
  SELECT * INTO stats_row FROM public.player_stats WHERE profile_id = caller_id FOR UPDATE;
  IF stats_row.level < recipe_row.required_level THEN
    RETURN json_build_object('success', false, 'error', format('Required level %s to craft this item.', recipe_row.required_level));
  END IF;

  -- 3. Check energy
  IF stats_row.energy < recipe_row.energy_cost THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient energy for crafting.');
  END IF;

  -- 4. Verify blueprint unlock if required
  IF recipe_row.is_blueprint_required THEN
    PERFORM 1 FROM public.item_blueprints WHERE profile_id = caller_id AND recipe_id = p_recipe_id;
    IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Unlocking blueprint is required for this recipe.');
    END IF;
  END IF;

  -- 5. Verify all ingredients are present in player bag
  has_ingredients := true;
  FOR ingredient_row IN 
    SELECT i.*, COALESCE(pr.quantity, 0) AS current_stock
    FROM public.item_recipe_inputs i
    LEFT JOIN public.player_resources pr ON pr.profile_id = caller_id AND pr.resource_id = i.resource_id
    WHERE i.recipe_id = p_recipe_id
  LOOP
    IF ingredient_row.current_stock < ingredient_row.quantity THEN
      has_ingredients := false;
    END IF;
  END LOOP;

  IF NOT has_ingredients THEN
    RETURN json_build_object('success', false, 'error', 'Missing required crafting ingredients.');
  END IF;

  -- 6. Consume ingredients and deduct energy
  FOR ingredient_row IN SELECT * FROM public.item_recipe_inputs WHERE recipe_id = p_recipe_id LOOP
    UPDATE public.player_resources
    SET quantity = quantity - ingredient_row.quantity
    WHERE profile_id = caller_id AND resource_id = ingredient_row.resource_id;
  END LOOP;

  UPDATE public.player_stats
  SET 
    energy = energy - recipe_row.energy_cost,
    experience = experience + recipe_row.experience_reward
  WHERE profile_id = caller_id;

  -- 7. Roll failure chance
  IF random() < recipe_row.failure_chance THEN
    -- Failure! Ingredients are consumed, return error
    INSERT INTO public.item_history (item_instance_id, item_template_id, profile_id, action, quantity, metadata)
    VALUES (null, recipe_row.result_template_id, caller_id, 'craft_failed', 1, '{}'::jsonb);

    RETURN json_build_object('success', false, 'error', 'Crafting failed. Ingredients lost in critical failure.');
  END IF;

  -- 8. Roll quality probabilities
  -- 70% Common (2), 20% Uncommon (3), 8% Rare (4), 2% Epic (5)
  crit_roll := random();
  new_quality := CASE
    WHEN crit_roll < 0.70 THEN 2
    WHEN crit_roll < 0.90 THEN 3
    WHEN crit_roll < 0.98 THEN 4
    ELSE 5
  END;

  -- 9. Create item instance if template has durability (weapons, armor, tools, etc.)
  IF recipe_row.max_durability > 0 THEN
    INSERT INTO public.item_instances (template_id, quality, current_durability, max_durability, metadata)
    VALUES (
      recipe_row.result_template_id,
      new_quality,
      recipe_row.max_durability,
      recipe_row.max_durability,
      json_build_object('crafted_by', caller_id, 'date', now())
    )
    RETURNING id INTO new_instance_id;

    -- Add to player bag inventories
    INSERT INTO public.inventories (owner_id, item_template_id, quantity, quality, item_instance_id)
    VALUES (caller_id, recipe_row.result_template_id, 1, new_quality, new_instance_id);

    -- Log action
    INSERT INTO public.item_history (item_instance_id, item_template_id, profile_id, action, quantity, metadata)
    VALUES (new_instance_id, recipe_row.result_template_id, caller_id, 'crafted', 1, json_build_object('quality', new_quality));
  ELSE
    -- Stackable item (no durability)
    INSERT INTO public.inventories (owner_id, item_template_id, quantity, quality, item_instance_id)
    VALUES (caller_id, recipe_row.result_template_id, recipe_row.result_quantity, new_quality, null)
    ON CONFLICT (owner_id, item_template_id, quality) WHERE (item_instance_id IS NULL)
    DO UPDATE SET quantity = public.inventories.quantity + EXCLUDED.quantity;

    -- Log action
    INSERT INTO public.item_history (item_instance_id, item_template_id, profile_id, action, quantity, metadata)
    VALUES (null, recipe_row.result_template_id, caller_id, 'crafted', recipe_row.result_quantity, json_build_object('quality', new_quality));
  END IF;

  RETURN json_build_object('success', true, 'error', null);
END;
$$ LANGUAGE plpgsql;
