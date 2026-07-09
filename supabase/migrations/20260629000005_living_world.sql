-- ==========================================
-- PHASE 7: LIVING WORLD & NPC ECONOMY SCHEMA
-- ==========================================

-- 1. Regional Economies
CREATE TABLE IF NOT EXISTS public.regional_economies (
  region_id INT PRIMARY KEY REFERENCES public.regions(id) ON DELETE CASCADE,
  population INT NOT NULL DEFAULT 1000 CHECK (population >= 0),
  employed INT NOT NULL DEFAULT 800 CHECK (employed >= 0),
  gdp NUMERIC(20, 2) NOT NULL DEFAULT 10000.00 CHECK (gdp >= 0),
  tax_reserves NUMERIC(20, 2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- 2. Configurable NPC Entities
CREATE TABLE IF NOT EXISTS public.npcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'citizen', -- citizen, worker, trader, military
  region_id INT REFERENCES public.regions(id) ON DELETE SET NULL,
  cash NUMERIC(20, 2) NOT NULL DEFAULT 100.00 CHECK (cash >= 0),
  strength NUMERIC(10, 4) NOT NULL DEFAULT 1.00 CHECK (strength >= 0),
  work_skill NUMERIC(10, 4) NOT NULL DEFAULT 1.00 CHECK (work_skill >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- 3. AI-Controlled Companies
CREATE TABLE IF NOT EXISTS public.npc_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  region_id INT REFERENCES public.regions(id) ON DELETE CASCADE,
  template_id INT REFERENCES public.company_templates(id) ON DELETE RESTRICT,
  vault_balance NUMERIC(20, 2) NOT NULL DEFAULT 500.00 CHECK (vault_balance >= 0),
  owner_npc_id UUID REFERENCES public.npcs(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- 4. NPC Company Inventories
CREATE TABLE IF NOT EXISTS public.npc_company_inventory (
  company_id UUID REFERENCES public.npc_companies(id) ON DELETE CASCADE,
  resource_id INT REFERENCES public.resources(id) ON DELETE RESTRICT,
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  PRIMARY KEY (company_id, resource_id)
);

-- 5. NPC Company Members
CREATE TABLE IF NOT EXISTS public.npc_company_members (
  company_id UUID REFERENCES public.npc_companies(id) ON DELETE CASCADE,
  npc_id UUID REFERENCES public.npcs(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'Employee',
  salary NUMERIC(20, 2) NOT NULL DEFAULT 10.00 CHECK (salary >= 0),
  PRIMARY KEY (company_id, npc_id)
);

-- 6. World Events
CREATE TABLE IF NOT EXISTS public.world_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- drought, mining_boom, strike, crisis
  region_id INT REFERENCES public.regions(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT true,
  modifiers_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  duration_ticks INT NOT NULL DEFAULT 10 CHECK (duration_ticks >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- 7. Simulation Analytics Logs
CREATE TABLE IF NOT EXISTS public.simulation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tick_index INT NOT NULL,
  region_id INT REFERENCES public.regions(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC(20, 4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- 8. NPC Activity Feeds
CREATE TABLE IF NOT EXISTS public.npc_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id INT REFERENCES public.regions(id) ON DELETE CASCADE,
  actor_name VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- 9. Scheduler Job Lock Table
CREATE TABLE IF NOT EXISTS public.scheduler_jobs (
  job_name VARCHAR(100) PRIMARY KEY,
  last_run_at TIMESTAMP WITH TIME ZONE,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  lock_acquired_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on new tables
ALTER TABLE public.regional_economies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.npc_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.npc_company_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.npc_company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.npc_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduler_jobs ENABLE ROW LEVEL SECURITY;

-- Select policies (Allow read to all authenticated users)
CREATE POLICY "Allow public read regional_economies" ON public.regional_economies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow public read npcs" ON public.npcs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow public read npc_companies" ON public.npc_companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow public read npc_company_inventory" ON public.npc_company_inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow public read npc_company_members" ON public.npc_company_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow public read world_events" ON public.world_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow public read simulation_logs" ON public.simulation_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow public read npc_activity_logs" ON public.npc_activity_logs FOR SELECT TO authenticated USING (true);

-- Stored Procedures: Scheduler Lock Mechanics
CREATE OR REPLACE FUNCTION public.acquire_scheduler_lock(target_job_name VARCHAR(100))
RETURNS BOOLEAN AS $$
DECLARE
  job_rec RECORD;
BEGIN
  SELECT * INTO job_rec FROM public.scheduler_jobs WHERE job_name = target_job_name FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.scheduler_jobs (job_name, is_locked, lock_acquired_at)
    VALUES (target_job_name, true, now());
    RETURN TRUE;
  END IF;

  IF job_rec.is_locked AND job_rec.lock_acquired_at > now() - INTERVAL '5 minutes' THEN
    RETURN FALSE;
  END IF;

  UPDATE public.scheduler_jobs
  SET is_locked = true, lock_acquired_at = now()
  WHERE job_name = target_job_name;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.release_scheduler_lock(target_job_name VARCHAR(100))
RETURNS VOID AS $$
BEGIN
  UPDATE public.scheduler_jobs
  SET is_locked = false, last_run_at = now()
  WHERE job_name = target_job_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Core Logic: execute_simulation_tick
CREATE OR REPLACE FUNCTION public.execute_simulation_tick()
RETURNS JSON AS $$
DECLARE
  next_tick INT;
  reg RECORD;
  comp RECORD;
  active_ev RECORD;
  food_listing RECORD;
  input_listing RECORD;
  price_record RECORD;
  
  consumed_food INT;
  consumed_water INT;
  food_secured INT;
  water_secured INT;
  event_chance INT;
  event_region INT;
  
  yield_qty INT;
  wage_paid NUMERIC(20, 2);
  has_inputs BOOLEAN;
  avg_price NUMERIC(20, 4);
  to_buy INT;
  cost NUMERIC(20, 2);
  target_input INT;
BEGIN
  -- 1. Tick Index Incrementation
  SELECT COALESCE(MAX(tick_index), 0) + 1 INTO next_tick FROM public.simulation_logs;

  -- 2. Process World Events Duration
  FOR active_ev IN SELECT * FROM public.world_events WHERE active = true LOOP
    IF active_ev.duration_ticks <= 1 THEN
      UPDATE public.world_events SET active = false, duration_ticks = 0 WHERE id = active_ev.id;
      INSERT INTO public.npc_activity_logs (region_id, actor_name, action, details)
      VALUES (active_ev.region_id, 'World Event Engine', 'event.ended', 'Event ' || active_ev.name || ' has ended.');
    ELSE
      UPDATE public.world_events SET duration_ticks = duration_ticks - 1 WHERE id = active_ev.id;
    END IF;
  END LOOP;

  -- 3. Trigger Random New Events (10% Chance per tick)
  event_chance := floor(random() * 100);
  IF event_chance < 10 THEN
    SELECT id INTO event_region FROM public.regions ORDER BY random() LIMIT 1;
    IF event_region IS NOT NULL THEN
      -- Create a Mining Boom Event
      INSERT INTO public.world_events (name, description, type, region_id, active, modifiers_json, duration_ticks)
      VALUES (
        'Mining Boom',
        'Rich carbon mineral deposits discovered. Coal and Iron Ore output multiplier increases by 50%.',
        'mining_boom',
        event_region,
        true,
        '{"yield_multiplier": 1.50}'::jsonb,
        15
      );
      INSERT INTO public.npc_activity_logs (region_id, actor_name, action, details)
      VALUES (event_region, 'World Event Engine', 'event.started', 'A Mining Boom event has begun in this region.');
    END IF;
  END IF;

  -- 4. Process Region Population Growth & Consumption
  FOR reg IN SELECT * FROM public.regions LOOP
    -- Base welfare budget and variables
    SELECT population, employed, gdp INTO consumed_food, consumed_water, wage_paid 
    FROM public.regional_economies WHERE region_id = reg.id;
    
    IF NOT FOUND THEN
      INSERT INTO public.regional_economies (region_id, population, employed, gdp, tax_reserves)
      VALUES (reg.id, 1000, 800, 10000.00, 0.00);
      consumed_food := 1000;
      consumed_water := 800;
    END IF;

    -- Food target: 0.05 units of grain/bread per pop
    consumed_food := ceil(consumed_food * 0.05);
    consumed_water := ceil(consumed_food * 0.05);
    food_secured := 0;
    water_secured := 0;

    -- Purchase Food/Grain (resource ID 5 and 14) from marketplace
    FOR food_listing IN 
      SELECT * FROM public.market_listings 
      WHERE region_id = reg.id AND resource_id IN (5, 14) AND status = 'active' AND quantity > 0
      ORDER BY price_per_unit ASC
    LOOP
      IF food_secured >= consumed_food THEN
        EXIT;
      END IF;

      to_buy := least(food_listing.quantity, consumed_food - food_secured);
      cost := to_buy * food_listing.price_per_unit;

      -- Deduct from listing
      UPDATE public.market_listings 
      SET quantity = quantity - to_buy,
          status = CASE WHEN quantity - to_buy = 0 THEN 'completed'::varchar ELSE status END,
          updated_at = now()
      WHERE id = food_listing.id;

      -- Transfer currency from GDP to seller (either player or NPC)
      IF food_listing.seller_id IS NOT NULL THEN
        UPDATE public.currencies SET local_currency_balance = local_currency_balance + cost WHERE profile_id = food_listing.seller_id;
      ELSIF food_listing.seller_company_id IS NOT NULL THEN
        UPDATE public.npc_companies SET vault_balance = vault_balance + cost WHERE id = food_listing.seller_company_id;
      END IF;

      food_secured := food_secured + to_buy;
    END LOOP;

    -- Population Growth adjustment based on food secured
    IF food_secured >= consumed_food THEN
      -- Growth
      UPDATE public.regional_economies
      SET population = population + ceil(population * 0.005),
          employed = least(population + ceil(population * 0.005), employed + ceil(population * 0.004)),
          gdp = gdp * 1.01,
          updated_at = now()
      WHERE region_id = reg.id;
    ELSE
      -- Declinement/shortage
      UPDATE public.regional_economies
      SET population = greatest(100, population - ceil(population * 0.015)),
          employed = greatest(80, employed - ceil(employed * 0.015)),
          gdp = gdp * 0.98,
          updated_at = now()
      WHERE region_id = reg.id;

      INSERT INTO public.npc_activity_logs (region_id, actor_name, action, details)
      VALUES (reg.id, 'Citizen Cohort', 'population.starvation', 'Widespread food shortage caused 1.5% population decline.');
    END IF;
  END LOOP;

  -- 5. NPC Companies Production Cycle
  FOR comp IN SELECT c.*, t.is_raw_camp, t.output_resource_id 
              FROM public.npc_companies c
              JOIN public.company_templates t ON t.id = c.template_id LOOP
    
    -- Wage verification (average worker salaries)
    SELECT COALESCE(SUM(salary), 0.00) INTO wage_paid FROM public.npc_company_members WHERE company_id = comp.id;
    
    IF comp.vault_balance < wage_paid THEN
      -- Bankrupt / Shut down
      INSERT INTO public.npc_activity_logs (region_id, actor_name, action, details)
      VALUES (comp.region_id, comp.name, 'company.bankrupt', 'Company went temporarily inactive due to wage deficit.');
      CONTINUE;
    END IF;

    -- Deduct salary from vault balance and add it to workers cash
    UPDATE public.npc_companies SET vault_balance = vault_balance - wage_paid WHERE id = comp.id;
    UPDATE public.npcs n 
    SET cash = n.cash + m.salary 
    FROM public.npc_company_members m 
    WHERE m.npc_id = n.id AND m.company_id = comp.id;

    IF comp.is_raw_camp THEN
      -- 1. Gather raw materials (outputs base quantity)
      yield_qty := 10;
      
      -- Apply world event yield modifiers
      SELECT COALESCE((modifiers_json->>'yield_multiplier')::numeric, 1.00) INTO avg_price
      FROM public.world_events 
      WHERE region_id = comp.region_id AND active = true AND type = 'mining_boom' LIMIT 1;
      
      IF avg_price IS NOT NULL THEN
        yield_qty := ceil(yield_qty * avg_price)::int;
      END IF;

      -- Add output to inventory stack
      INSERT INTO public.npc_company_inventory (company_id, resource_id, quantity)
      VALUES (comp.id, comp.output_resource_id, yield_qty)
      ON CONFLICT (company_id, resource_id) DO UPDATE 
      SET quantity = public.npc_company_inventory.quantity + yield_qty;

      -- 2. Place sell listing on the marketplace
      INSERT INTO public.market_listings (seller_company_id, asset_type, resource_id, quantity, price_per_unit, currency_type, status, region_id)
      VALUES (comp.id, 'resource', comp.output_resource_id, yield_qty, 2.50, 'local', 'active', comp.region_id);

      INSERT INTO public.npc_activity_logs (region_id, actor_name, action, details)
      VALUES (comp.region_id, comp.name, 'factory.produce', 'Harvested and listed ' || yield_qty || ' raw materials on marketplace.');

    ELSE
      -- Smelter or Bakery requiring inputs
      -- Bakery (14) outputs Bread, requires Grain (5, qty 2) and Water (7, qty 1)
      -- Smelter (11) outputs Steel, requires Iron Ore (3, qty 2) and Coal (4, qty 2)
      has_inputs := true;

      IF comp.template_id = 14 THEN
        -- Check Grain
        SELECT quantity INTO yield_qty FROM public.npc_company_inventory WHERE company_id = comp.id AND resource_id = 5;
        IF yield_qty IS NULL OR yield_qty < 2 THEN has_inputs := false; END IF;
      ELSIF comp.template_id = 11 THEN
        -- Check Iron
        SELECT quantity INTO yield_qty FROM public.npc_company_inventory WHERE company_id = comp.id AND resource_id = 3;
        IF yield_qty IS NULL OR yield_qty < 2 THEN has_inputs := false; END IF;
      END IF;

      IF has_inputs THEN
        -- Consume inputs
        IF comp.template_id = 14 THEN
          UPDATE public.npc_company_inventory SET quantity = quantity - 2 WHERE company_id = comp.id AND resource_id = 5;
          UPDATE public.npc_company_inventory SET quantity = quantity - 1 WHERE company_id = comp.id AND resource_id = 7;
        ELSIF comp.template_id = 11 THEN
          UPDATE public.npc_company_inventory SET quantity = quantity - 2 WHERE company_id = comp.id AND resource_id = 3;
          UPDATE public.npc_company_inventory SET quantity = quantity - 2 WHERE company_id = comp.id AND resource_id = 4;
        END IF;

        -- Add outputs
        INSERT INTO public.npc_company_inventory (company_id, resource_id, quantity)
        VALUES (comp.id, comp.output_resource_id, 5)
        ON CONFLICT (company_id, resource_id) DO UPDATE 
        SET quantity = public.npc_company_inventory.quantity + 5;

        -- List refined outputs
        INSERT INTO public.market_listings (seller_company_id, asset_type, resource_id, quantity, price_per_unit, currency_type, status, region_id)
        VALUES (comp.id, 'resource', comp.output_resource_id, 5, 8.50, 'local', 'active', comp.region_id);

        INSERT INTO public.npc_activity_logs (region_id, actor_name, action, details)
        VALUES (comp.region_id, comp.name, 'factory.manufacture', 'Consumed inputs and listed 5 refined products on marketplace.');
      ELSE
        -- AI decision: Purchase input shortages from market
        target_input := CASE WHEN comp.template_id = 14 THEN 5 ELSE 3 END;
        FOR input_listing IN 
          SELECT * FROM public.market_listings 
          WHERE region_id = comp.region_id AND resource_id = target_input AND status = 'active' AND quantity > 0
          ORDER BY price_per_unit ASC LIMIT 1
        LOOP
          IF comp.vault_balance >= input_listing.price_per_unit THEN
            -- Purchase 1 unit of input
            UPDATE public.market_listings 
            SET quantity = quantity - 1,
                status = CASE WHEN quantity - 1 = 0 THEN 'completed'::varchar ELSE status END
            WHERE id = input_listing.id;

            UPDATE public.npc_companies SET vault_balance = vault_balance - input_listing.price_per_unit WHERE id = comp.id;
            
            -- Add input to company stock
            INSERT INTO public.npc_company_inventory (company_id, resource_id, quantity)
            VALUES (comp.id, target_input, 1)
            ON CONFLICT (company_id, resource_id) DO UPDATE 
            SET quantity = public.npc_company_inventory.quantity + 1;
          END IF;
        END LOOP;
      END IF;
    END IF;
  END LOOP;

  -- 6. Dynamic Prices Fluctuation (Emergent Market AI)
  -- For active NPC listings: if not sold, decrease price by 5%. If sold quickly, increase next price.
  UPDATE public.market_listings
  SET price_per_unit = greatest(0.50, price_per_unit * 0.95)
  WHERE seller_company_id IS NOT NULL AND status = 'active' AND created_at < now() - INTERVAL '30 seconds';

  -- 7. Analytics Statistics Logging
  FOR reg IN SELECT * FROM public.regions LOOP
    -- Average Price of Grain
    SELECT COALESCE(AVG(price_per_unit), 1.20) INTO avg_price FROM public.market_listings 
    WHERE region_id = reg.id AND resource_id = 5 AND status = 'active';
    INSERT INTO public.simulation_logs (tick_index, region_id, metric_name, metric_value)
    VALUES (next_tick, reg.id, 'price.grain', avg_price);

    -- Average Price of Bread
    SELECT COALESCE(AVG(price_per_unit), 5.00) INTO avg_price FROM public.market_listings 
    WHERE region_id = reg.id AND resource_id = 14 AND status = 'active';
    INSERT INTO public.simulation_logs (tick_index, region_id, metric_name, metric_value)
    VALUES (next_tick, reg.id, 'price.bread', avg_price);

    -- GDP stats
    SELECT GDP INTO avg_price FROM public.regional_economies WHERE region_id = reg.id;
    INSERT INTO public.simulation_logs (tick_index, region_id, metric_name, metric_value)
    VALUES (next_tick, reg.id, 'gdp.total', COALESCE(avg_price, 10000.00));
  END LOOP;

  RETURN json_build_object('success', true, 'tick_index', next_tick);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Idempotent entry point wrapper with Lock checking
CREATE OR REPLACE FUNCTION public.scheduler_tick()
RETURNS JSON AS $$
DECLARE
  lock_acquired BOOLEAN;
  tick_res JSON;
BEGIN
  lock_acquired := public.acquire_scheduler_lock('simulation_tick');
  IF NOT lock_acquired THEN
    RETURN json_build_object('success', false, 'error', 'Scheduler lock busy. Tick already executing.');
  END IF;

  BEGIN
    tick_res := public.execute_simulation_tick();
    PERFORM public.release_scheduler_lock('simulation_tick');
    RETURN tick_res;
  EXCEPTION WHEN OTHERS THEN
    PERFORM public.release_scheduler_lock('simulation_tick');
    RAISE EXCEPTION 'Simulation execution failed: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- NOTE: seed_living_world() was referenced here but never defined.
-- NPC seeding is handled by the npc_companies and related inserts above.
-- SELECT public.seed_living_world() WHERE NOT EXISTS (SELECT 1 FROM public.npcs);

