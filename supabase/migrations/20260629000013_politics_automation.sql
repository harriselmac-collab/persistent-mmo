-- ==========================================
-- PHASE 9: NATIONS, POLITICS & GOVERNMENT AUTOMATION
-- ==========================================

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

  -- Political/Election variables
  elect_rec RECORD;
  bill_rec RECORD;
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
  UPDATE public.market_listings
  SET price_per_unit = greatest(0.50, price_per_unit * 0.95)
  WHERE seller_company_id IS NOT NULL AND status = 'active' AND created_at < now() - INTERVAL '30 seconds';

  -- 7. Geopolitical & Legislative Automation (Milestone 5)
  -- Automate expired election transitions
  FOR elect_rec IN 
    SELECT id FROM public.elections 
    WHERE status = 'campaign' AND ends_at <= now() 
  LOOP
    PERFORM public.rpc_execute_election_transition(elect_rec.id);
  END LOOP;

  -- Automate expired bill resolution
  FOR bill_rec IN 
    SELECT id FROM public.bills 
    WHERE status = 'voting' AND ends_at <= now() 
  LOOP
    PERFORM public.rpc_tally_and_execute_bill(bill_rec.id);
  END LOOP;

  -- 8. Analytics Statistics Logging
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
