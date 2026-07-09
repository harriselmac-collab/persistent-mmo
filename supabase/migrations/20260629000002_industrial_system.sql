-- ==========================================
-- PHASE 4: INDUSTRIAL SYSTEM SCHEMA
-- ==========================================

-- Seed refined resources if not already existing
INSERT INTO resources (id, name, icon, description, rarity, category, weight, base_value, stack_limit, enabled, created_at)
VALUES 
  (11, 'Steel', 'Hammer', 'High-strength refined alloy for weapons and structures.', 'uncommon', 'refined', 1.00, 15.0, 999, true, now()),
  (12, 'Fabric', 'Scissors', 'Woven textiles used to manufacture apparel and sails.', 'common', 'refined', 0.20, 10.0, 999, true, now()),
  (13, 'Fuel', 'Container', 'Distilled liquid hydrocarbon to power generators.', 'uncommon', 'refined', 0.50, 12.0, 999, true, now()),
  (14, 'Bread', 'Wheat', 'Baked wheat loaf which restores energy.', 'common', 'refined', 0.15, 5.0, 999, true, now())
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  weight = EXCLUDED.weight,
  base_value = EXCLUDED.base_value;

-- 1. Company Templates
CREATE TABLE IF NOT EXISTS company_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  cost_gold NUMERIC(10,2) DEFAULT 0.00,
  cost_local NUMERIC(10,2) DEFAULT 100.00,
  is_raw_camp BOOLEAN DEFAULT true, -- true = extracts raw material directly, false = processes recipes
  output_resource_id INT REFERENCES resources(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Seed company templates
INSERT INTO company_templates (id, name, description, cost_gold, cost_local, is_raw_camp, output_resource_id)
VALUES 
  (1, 'Wood Camp', 'Harvests logs from nearby forestry areas.', 0.00, 100.00, true, 1),
  (2, 'Stone Quarry', 'Extracts stone blocks from rock walls.', 0.00, 100.00, true, 2),
  (3, 'Iron Mine', 'Digs deep tunnels to harvest unrefined iron ore.', 0.00, 150.00, true, 3),
  (4, 'Coal Mine', 'Extracts carbon veins to fire smelters and furnaces.', 0.00, 150.00, true, 4),
  (5, 'Grain Farm', 'Grows organic wheat grain stocks.', 0.00, 100.00, true, 5),
  (6, 'Fishing Company', 'Nets catches in water blocks.', 0.00, 120.00, true, 6),
  (7, 'Water Plant', 'Purifies water stocks.', 0.00, 80.00, true, 7),
  (8, 'Oil Refinery', 'Pumps unrefined liquid crude oil.', 0.00, 250.00, true, 8),
  (9, 'Copper Mine', 'Harvests copper veins.', 0.00, 150.00, true, 9),
  (10, 'Textile Mill', 'Harvests fibers from cotton plantations.', 0.00, 120.00, true, 10),
  (11, 'Steel Factory', 'Smelts iron ore and coal into structural steel plates.', 1.00, 500.00, false, 11),
  (12, 'Textile Factory', 'Weaves cotton and water into commercial fabric bolts.', 0.00, 350.00, false, 12),
  (13, 'Fuel Distillery', 'Refines petroleum and coal into high-energy fuel cylinders.', 1.00, 450.00, false, 13),
  (14, 'Bakery', 'Bakes bread loaves using grain, water, and coal.', 0.00, 300.00, false, 14)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  cost_local = EXCLUDED.cost_local,
  is_raw_camp = EXCLUDED.is_raw_camp,
  output_resource_id = EXCLUDED.output_resource_id;

-- 2. Companies List
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  owner_id UUID REFERENCES profiles(id) ON DELETE RESTRICT NOT NULL,
  region_id INT REFERENCES regions(id) ON DELETE RESTRICT NOT NULL,
  template_id INT REFERENCES company_templates(id) ON DELETE RESTRICT NOT NULL,
  level INT DEFAULT 1 NOT NULL,
  experience INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Company Cash Vault
CREATE TABLE IF NOT EXISTS company_vaults (
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE PRIMARY KEY,
  gold NUMERIC(15,2) DEFAULT 0.00 NOT NULL CHECK (gold >= 0.00),
  local_currency NUMERIC(15,2) DEFAULT 0.00 NOT NULL CHECK (local_currency >= 0.00),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Company Employee Members Registry
CREATE TABLE IF NOT EXISTS company_members (
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'Employee' NOT NULL, -- Owner, Director, Manager, Employee, Accountant
  salary NUMERIC(10,2) DEFAULT 10.00 NOT NULL CHECK (salary >= 0.00),
  shifts_worked_today INT DEFAULT 0 NOT NULL,
  max_daily_shifts INT DEFAULT 5 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (company_id, profile_id)
);

-- 5. Company Item Vault (Inventory)
CREATE TABLE IF NOT EXISTS company_inventory (
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  resource_id INT REFERENCES resources(id) ON DELETE RESTRICT,
  quantity INT DEFAULT 0 NOT NULL CHECK (quantity >= 0),
  PRIMARY KEY (company_id, resource_id)
);

-- 6. Company Job Postings
CREATE TABLE IF NOT EXISTS company_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  region_id INT REFERENCES regions(id) ON DELETE RESTRICT NOT NULL,
  salary NUMERIC(10,2) NOT NULL CHECK (salary >= 0.00),
  vacancies INT NOT NULL CHECK (vacancies >= 0),
  enabled BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Recipes List
CREATE TABLE IF NOT EXISTS production_recipes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  output_resource_id INT REFERENCES resources(id) NOT NULL,
  output_quantity INT DEFAULT 1 NOT NULL,
  base_production_time INT DEFAULT 5 NOT NULL, -- in seconds
  experience_reward INT DEFAULT 10 NOT NULL,
  enabled BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Seed recipes
INSERT INTO production_recipes (id, name, description, output_resource_id, output_quantity, base_production_time, experience_reward)
VALUES
  (1, 'Bake Bread', 'Bakes raw grain, water, and fuel into standard wheat bread loaves.', 14, 1, 5, 15),
  (2, 'Smelt Steel', 'Smelts raw iron ore with coal fuel into carbon steel rods.', 11, 1, 8, 25),
  (3, 'Weave Fabric', 'Spins cotton crop fibers and water on looms into fabric bolts.', 12, 1, 5, 12),
  (4, 'Distill Fuel', 'Distills raw oil reserves with coal into refined fuels.', 13, 1, 10, 30)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  output_resource_id = EXCLUDED.output_resource_id,
  base_production_time = EXCLUDED.base_production_time;

-- 8. Recipe Inputs Mapping
CREATE TABLE IF NOT EXISTS production_inputs (
  recipe_id INT REFERENCES production_recipes(id) ON DELETE CASCADE,
  resource_id INT REFERENCES resources(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (recipe_id, resource_id)
);

-- Seed recipe inputs
INSERT INTO production_inputs (recipe_id, resource_id, quantity)
VALUES
  (1, 5, 2), -- Bread needs 2 Grain
  (1, 7, 1), -- Bread needs 1 Water
  (1, 4, 1), -- Bread needs 1 Coal
  
  (2, 3, 2), -- Steel needs 2 Iron Ore
  (2, 4, 1), -- Steel needs 1 Coal
  
  (3, 10, 3), -- Fabric needs 3 Cotton
  (3, 7, 1),  -- Fabric needs 1 Water
  
  (4, 8, 2), -- Fuel needs 2 Oil
  (4, 4, 1)  -- Fuel needs 1 Coal
ON CONFLICT (recipe_id, resource_id) DO UPDATE SET 
  quantity = EXCLUDED.quantity;

-- 9. Active Production Line Queues
CREATE TABLE IF NOT EXISTS company_production_queues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  recipe_id INT REFERENCES production_recipes(id) ON DELETE RESTRICT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  quantity_completed INT DEFAULT 0 NOT NULL CHECK (quantity_completed <= quantity),
  status VARCHAR(50) DEFAULT 'waiting' NOT NULL, -- waiting, running, completed, paused, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. Upgrade Machines
CREATE TABLE IF NOT EXISTS company_machines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  speed_modifier NUMERIC(5,2) DEFAULT 1.00 NOT NULL,
  efficiency_modifier NUMERIC(5,2) DEFAULT 1.00 NOT NULL,
  cost_modifier NUMERIC(5,2) DEFAULT 1.00 NOT NULL,
  maintenance_cost NUMERIC(10,2) DEFAULT 5.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 11. Company Actions Audit Logs
CREATE TABLE IF NOT EXISTS company_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- INDEXES & CONSTRAINTS FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_company_members_profile ON company_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_company_jobs_enabled ON company_jobs(enabled);
CREATE INDEX IF NOT EXISTS idx_company_queue_status ON company_production_queues(company_id, status);
CREATE INDEX IF NOT EXISTS idx_company_logs_company ON company_logs(company_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE company_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_production_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_logs ENABLE ROW LEVEL SECURITY;

-- Read rules for all players
CREATE POLICY select_templates ON company_templates FOR SELECT USING (true);
CREATE POLICY select_companies ON companies FOR SELECT USING (true);
CREATE POLICY select_vaults ON company_vaults FOR SELECT USING (true);
CREATE POLICY select_members ON company_members FOR SELECT USING (true);
CREATE POLICY select_comp_inventory ON company_inventory FOR SELECT USING (true);
CREATE POLICY select_comp_jobs ON company_jobs FOR SELECT USING (true);
CREATE POLICY select_recipes ON production_recipes FOR SELECT USING (true);
CREATE POLICY select_inputs ON production_inputs FOR SELECT USING (true);
CREATE POLICY select_comp_queues ON company_production_queues FOR SELECT USING (true);
CREATE POLICY select_comp_machines ON company_machines FOR SELECT USING (true);
CREATE POLICY select_comp_logs ON company_logs FOR SELECT USING (true);

-- ==========================================
-- TRANSACTION PROCEDURES & TRIGGER FUNCTIONS
-- ==========================================

-- Trigger to atomically initialize company vaults upon creation
CREATE OR REPLACE FUNCTION trigger_initialize_company_vault()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO company_vaults (company_id, gold, local_currency, updated_at)
  VALUES (NEW.id, 0.00, 0.00, NOW());
  
  -- Insert owner as Owner member
  INSERT INTO company_members (company_id, profile_id, role, salary, shifts_worked_today, max_daily_shifts, created_at)
  VALUES (NEW.id, NEW.owner_id, 'Owner', 0.00, 0, 999, NOW());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_company_vault_init
AFTER INSERT ON companies
FOR EACH ROW
EXECUTE FUNCTION trigger_initialize_company_vault();


-- RPC: Create Company
CREATE OR REPLACE FUNCTION rpc_create_company(
  target_name VARCHAR(100),
  target_region_id INT,
  target_template_id INT
)
RETURNS JSON AS $$
DECLARE
  caller_id UUID;
  template_row RECORD;
  wallet RECORD;
  new_company_id UUID;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated.');
  END IF;

  -- Validate template
  SELECT * INTO template_row FROM company_templates WHERE id = target_template_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid company template.');
  END IF;

  -- Validate unique name
  IF EXISTS (SELECT 1 FROM companies WHERE name = target_name) THEN
    RETURN json_build_object('success', false, 'error', 'A company with this name already exists.');
  END IF;

  -- Get caller balances
  SELECT * INTO wallet FROM currencies WHERE profile_id = caller_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Currencies wallet not initialized.');
  END IF;

  -- Verify costs
  IF wallet.gold < template_row.cost_gold OR wallet.local_currency_balance < template_row.cost_local THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient funds to create this company.');
  END IF;

  -- Deduct costs
  UPDATE currencies 
  SET 
    gold = gold - template_row.cost_gold,
    local_currency_balance = local_currency_balance - template_row.cost_local,
    updated_at = NOW()
  WHERE profile_id = caller_id;

  -- Insert company
  INSERT INTO companies (name, owner_id, region_id, template_id, level, experience, created_at)
  VALUES (target_name, caller_id, target_region_id, target_template_id, 1, 0, NOW())
  RETURNING id INTO new_company_id;

  -- Write logs
  INSERT INTO company_logs (company_id, actor_id, action, metadata, created_at)
  VALUES (new_company_id, caller_id, 'company.created', json_build_object('cost_local', template_row.cost_local, 'cost_gold', template_row.cost_gold), NOW());

  -- Audit log entries
  INSERT INTO audit_logs (profile_id, action, metadata, created_at)
  VALUES (caller_id, 'company.create', json_build_object('company_id', new_company_id, 'company_name', target_name), NOW());

  RETURN json_build_object('success', true, 'company_id', new_company_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC: Transfer vault cash
CREATE OR REPLACE FUNCTION rpc_vault_transaction(
  target_company_id UUID,
  amount NUMERIC(15,2),
  is_deposit BOOLEAN
)
RETURNS JSON AS $$
DECLARE
  caller_id UUID;
  member_row RECORD;
  vault_row RECORD;
  wallet RECORD;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated.');
  END IF;

  -- Check membership and permissions
  SELECT * INTO member_row FROM company_members WHERE company_id = target_company_id AND profile_id = caller_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'You are not a member of this company.');
  END IF;

  -- Only Owner, Director, Manager, Accountant can deposit/withdraw cash
  IF member_row.role NOT IN ('Owner', 'Director', 'Manager', 'Accountant') THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient permissions to interact with vault funds.');
  END IF;

  SELECT * INTO wallet FROM currencies WHERE profile_id = caller_id;
  SELECT * INTO vault_row FROM company_vaults WHERE company_id = target_company_id;

  IF is_deposit THEN
    -- Verify player has amount
    IF wallet.local_currency_balance < amount THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient wallet funds.');
    END IF;

    -- Update player wallet
    UPDATE currencies SET local_currency_balance = local_currency_balance - amount, updated_at = NOW() WHERE profile_id = caller_id;
    -- Update vault
    UPDATE company_vaults SET local_currency = local_currency + amount, updated_at = NOW() WHERE company_id = target_company_id;
    
    -- Log
    INSERT INTO company_logs (company_id, actor_id, action, metadata, created_at)
    VALUES (target_company_id, caller_id, 'vault.deposit_cash', json_build_object('amount', amount), NOW());
  ELSE
    -- Verify vault has amount
    IF vault_row.local_currency < amount THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient vault funds.');
    END IF;

    -- Update vault
    UPDATE company_vaults SET local_currency = local_currency - amount, updated_at = NOW() WHERE company_id = target_company_id;
    -- Update player wallet
    UPDATE currencies SET local_currency_balance = local_currency_balance + amount, updated_at = NOW() WHERE profile_id = caller_id;

    -- Log
    INSERT INTO company_logs (company_id, actor_id, action, metadata, created_at)
    VALUES (target_company_id, caller_id, 'vault.withdraw_cash', json_build_object('amount', amount), NOW());
  END IF;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC: Transfer vault resources
CREATE OR REPLACE FUNCTION rpc_vault_resource(
  target_company_id UUID,
  target_resource_id INT,
  target_quantity INT,
  is_deposit BOOLEAN
)
RETURNS JSON AS $$
DECLARE
  caller_id UUID;
  member_row RECORD;
  player_inv RECORD;
  vault_inv RECORD;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated.');
  END IF;

  SELECT * INTO member_row FROM company_members WHERE company_id = target_company_id AND profile_id = caller_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'You are not a member of this company.');
  END IF;

  IF member_row.role NOT IN ('Owner', 'Director', 'Manager') THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient permissions to transfer physical assets.');
  END IF;

  IF is_deposit THEN
    -- Verify player inventory
    SELECT * INTO player_inv FROM player_resources WHERE profile_id = caller_id AND resource_id = target_resource_id;
    IF NOT FOUND OR player_inv.quantity < target_quantity THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient resource quantity in backpack.');
    END If;

    -- Deduct player inventory
    UPDATE player_resources SET quantity = quantity - target_quantity WHERE profile_id = caller_id AND resource_id = target_resource_id;
    
    -- Add to company inventory
    INSERT INTO company_inventory (company_id, resource_id, quantity)
    VALUES (target_company_id, target_resource_id, target_quantity)
    ON CONFLICT (company_id, resource_id) DO UPDATE SET quantity = company_inventory.quantity + target_quantity;

    INSERT INTO company_logs (company_id, actor_id, action, metadata, created_at)
    VALUES (target_company_id, caller_id, 'vault.deposit_resource', json_build_object('resource_id', target_resource_id, 'quantity', target_quantity), NOW());
  ELSE
    -- Verify company inventory
    SELECT * INTO vault_inv FROM company_inventory WHERE company_id = target_company_id AND resource_id = target_resource_id;
    IF NOT FOUND OR vault_inv.quantity < target_quantity THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient resource quantity in company vault.');
    END IF;

    -- Deduct company inventory
    UPDATE company_inventory SET quantity = quantity - target_quantity WHERE company_id = target_company_id AND resource_id = target_resource_id;

    -- Add to player inventory
    INSERT INTO player_resources (profile_id, resource_id, quantity)
    VALUES (caller_id, target_resource_id, target_quantity)
    ON CONFLICT (profile_id, resource_id) DO UPDATE SET quantity = player_resources.quantity + target_quantity;

    INSERT INTO company_logs (company_id, actor_id, action, metadata, created_at)
    VALUES (target_company_id, caller_id, 'vault.withdraw_resource', json_build_object('resource_id', target_resource_id, 'quantity', target_quantity), NOW());
  END IF;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC: Queue Production Recipe order
CREATE OR REPLACE FUNCTION rpc_queue_production(
  target_company_id UUID,
  target_recipe_id INT,
  target_quantity INT
)
RETURNS JSON AS $$
DECLARE
  caller_id UUID;
  member_row RECORD;
  recipe_row RECORD;
  req_input RECORD;
  available_qty INT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated.');
  END IF;

  SELECT * INTO member_row FROM company_members WHERE company_id = target_company_id AND profile_id = caller_id;
  IF NOT FOUND OR member_row.role NOT IN ('Owner', 'Director', 'Manager') THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient authority to post recipes to the assembly line.');
  END IF;

  SELECT * INTO recipe_row FROM production_recipes WHERE id = target_recipe_id AND enabled = true;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or disabled production recipe.');
  END IF;

  -- Validate that company has inputs in inventory and lock/consume them
  FOR req_input IN (SELECT * FROM production_inputs WHERE recipe_id = target_recipe_id) LOOP
    SELECT quantity INTO available_qty FROM company_inventory WHERE company_id = target_company_id AND resource_id = req_input.resource_id;
    
    IF available_qty IS NULL OR available_qty < (req_input.quantity * target_quantity) THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient raw inputs inside company vault to feed recipe queue.');
    END IF;
  END LOOP;

  -- Lock and consume ingredients
  FOR req_input IN (SELECT * FROM production_inputs WHERE recipe_id = target_recipe_id) LOOP
    UPDATE company_inventory 
    SET quantity = quantity - (req_input.quantity * target_quantity) 
    WHERE company_id = target_company_id AND resource_id = req_input.resource_id;
  END LOOP;

  -- Queue order
  INSERT INTO company_production_queues (company_id, recipe_id, quantity, quantity_completed, status, created_at)
  VALUES (target_company_id, target_recipe_id, target_quantity, 0, 'waiting', NOW());

  INSERT INTO company_logs (company_id, actor_id, action, metadata, created_at)
  VALUES (target_company_id, caller_id, 'production.queued', json_build_object('recipe_id', target_recipe_id, 'quantity', target_quantity), NOW());

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC: Work shift labor contribution at company
CREATE OR REPLACE FUNCTION rpc_work_shift_company(
  target_company_id UUID
)
RETURNS JSON AS $$
DECLARE
  caller_id UUID;
  member_row RECORD;
  stats RECORD;
  vault RECORD;
  comp RECORD;
  temp RECORD;
  queue_item RECORD;
  recipe RECORD;
  
  exp_reward INT;
  xp_level_threshold RECORD;
  leveled_up BOOLEAN;
  qty_crafted INT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated.');
  END IF;

  SELECT * INTO member_row FROM company_members WHERE company_id = target_company_id AND profile_id = caller_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'You are not employed by this company.');
  END IF;

  IF member_row.shifts_worked_today >= member_row.max_daily_shifts THEN
    RETURN json_build_object('success', false, 'error', 'Daily labor limit reached.');
  END IF;

  -- Verify player energy
  SELECT * INTO stats FROM player_stats WHERE profile_id = caller_id;
  IF stats.energy < 10 THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient personal energy. Shift requires 10 EP.');
  END IF;

  -- Verify vault cash for salary payment
  SELECT * INTO vault FROM company_vaults WHERE company_id = target_company_id;
  IF vault.local_currency < member_row.salary THEN
    RETURN json_build_object('success', false, 'error', 'Company vault has insufficient cash reserves to pay your shift wage.');
  END IF;

  SELECT * INTO comp FROM companies WHERE id = target_company_id;
  SELECT * INTO temp FROM company_templates WHERE id = comp.template_id;

  IF temp.is_raw_camp THEN
    -- Raw Camp extraction shift
    qty_crafted := floor(1 + stats.work_skill * 0.05);

    -- Deposit resource in company inventory
    INSERT INTO company_inventory (company_id, resource_id, quantity)
    VALUES (target_company_id, temp.output_resource_id, qty_crafted)
    ON CONFLICT (company_id, resource_id) DO UPDATE SET quantity = company_inventory.quantity + qty_crafted;

    exp_reward := 10;
  ELSE
    -- Manufacturing factory shift: Requires active queue items
    SELECT * INTO queue_item 
    FROM company_production_queues 
    WHERE company_id = target_company_id AND status IN ('waiting', 'running')
    ORDER BY created_at ASC 
    LIMIT 1;

    IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Assembly line queue is empty. Queue production recipes first!');
    END IF;

    -- Update queue status
    UPDATE company_production_queues SET status = 'running' WHERE id = queue_item.id;

    SELECT * INTO recipe FROM production_recipes WHERE id = queue_item.recipe_id;
    qty_crafted := recipe.output_quantity;

    -- Deposit refined resource output in vault
    INSERT INTO company_inventory (company_id, resource_id, quantity)
    VALUES (target_company_id, recipe.output_resource_id, qty_crafted)
    ON CONFLICT (company_id, resource_id) DO UPDATE SET quantity = company_inventory.quantity + qty_crafted;

    -- Advance queue completion
    IF (queue_item.quantity_completed + 1) >= queue_item.quantity THEN
      UPDATE company_production_queues SET quantity_completed = quantity, status = 'completed' WHERE id = queue_item.id;
    ELSE
      UPDATE company_production_queues SET quantity_completed = quantity_completed + 1 WHERE id = queue_item.id;
    END IF;

    exp_reward := recipe.experience_reward;
  END IF;

  -- 1. Deduct EP from worker
  UPDATE player_stats SET energy = energy - 10, experience = experience + exp_reward, work_skill = work_skill + 0.1, updated_at = NOW() WHERE profile_id = caller_id;
  
  -- 2. Transmit energy audit log
  INSERT INTO energy_history (profile_id, change_amount, reason, created_at)
  VALUES (caller_id, -10, concat('company_work_', temp.name), NOW());

  -- 3. Pay salary out of company vault into player wallet
  UPDATE company_vaults SET local_currency = local_currency - member_row.salary, updated_at = NOW() WHERE company_id = target_company_id;
  UPDATE currencies SET local_currency_balance = local_currency_balance + member_row.salary, updated_at = NOW() WHERE profile_id = caller_id;

  -- 4. Advance shift counters
  UPDATE company_members SET shifts_worked_today = shifts_worked_today + 1 WHERE company_id = target_company_id AND profile_id = caller_id;

  -- 5. Level Up loops check
  SELECT * INTO stats FROM player_stats WHERE profile_id = caller_id;
  leveled_up := false;
  LOOP
    SELECT * INTO xp_level_threshold FROM experience_tables WHERE level = stats.level;
    EXIT WHEN xp_level_threshold IS NULL;

    IF stats.experience >= xp_level_threshold.required_experience THEN
      UPDATE player_stats SET experience = experience - xp_level_threshold.required_experience, level = level + 1, energy = 100 WHERE profile_id = caller_id;
      stats.experience := stats.experience - xp_level_threshold.required_experience;
      stats.level := stats.level + 1;
      leveled_up := true;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  -- 6. Grant Company experience and level checks
  UPDATE companies SET experience = experience + exp_reward WHERE id = target_company_id;
  
  -- Verify corporate leveling thresholds (e.g. lvl * lvl * 100)
  LOOP
    SELECT * INTO comp FROM companies WHERE id = target_company_id;
    IF comp.experience >= (comp.level * comp.level * 100) THEN
      UPDATE companies 
      SET 
        experience = experience - (level * level * 100), 
        level = level + 1 
      WHERE id = target_company_id;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  -- 7. Log
  INSERT INTO company_logs (company_id, actor_id, action, metadata, created_at)
  VALUES (target_company_id, caller_id, 'labor.shift_completed', json_build_object('wage_paid', member_row.salary, 'experience_earned', exp_reward), NOW());

  INSERT INTO audit_logs (profile_id, action, metadata, created_at)
  VALUES (caller_id, 'company.shift', json_build_object('company_id', target_company_id, 'wage_earned', member_row.salary), NOW());

  RETURN json_build_object(
    'success', true, 
    'salary_earned', member_row.salary, 
    'exp_rewarded', exp_reward, 
    'leveled_up', leveled_up,
    'new_energy', stats.energy
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
