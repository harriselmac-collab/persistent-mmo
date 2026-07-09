-- Aegis Kingdoms: Phase 2 World Economy Schema

-- 1. RESOURCES SCHEMA
create table public.resources (
    id serial primary key,
    name text not null unique check (char_length(name) >= 2 and char_length(name) <= 50),
    icon text not null default 'Box',
    description text not null default '',
    rarity text not null default 'common' check (rarity in ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    category text not null default 'raw' check (category in ('raw', 'refined', 'special')),
    weight numeric(6,2) not null default 0.10 check (weight >= 0),
    base_value numeric(12,4) not null default 1.0 check (base_value >= 0),
    stack_limit int not null default 999 check (stack_limit > 0),
    enabled boolean not null default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. EXPERIENCE LEVEL TABLES
create table public.experience_tables (
    level int primary key check (level >= 1),
    required_experience bigint not null check (required_experience >= 0)
);

-- 3. REGIONS UPDATES
-- Drop old columns on regions table if present
alter table public.regions drop column if exists resource_type;
alter table public.regions drop column if exists resource_abundance;

-- Add extended attributes to regions
alter table public.regions add column if not exists climate text not null default 'temperate';
alter table public.regions add column if not exists population int not null default 100 check (population >= 0);
alter table public.regions add column if not exists production_bonus numeric(3,2) not null default 1.00 check (production_bonus >= 0);
alter table public.regions add column if not exists travel_cost int not null default 10 check (travel_cost >= 0);
alter table public.regions add column if not exists travel_cooldown int not null default 60 check (travel_cooldown >= 0);

-- 4. RESOURCE SPAWNS (Configurable Availability Map)
create table public.resource_spawn_tables (
    region_id int not null references public.regions(id) on delete cascade,
    resource_id int not null references public.resources(id) on delete cascade,
    spawn_weight numeric(3,2) not null default 1.00 check (spawn_weight >= 0 and spawn_weight <= 2.00),
    energy_cost int not null default 10 check (energy_cost >= 0),
    production_time int not null default 5 check (production_time >= 0), -- seconds
    experience_reward int not null default 10 check (experience_reward >= 0),
    primary key (region_id, resource_id)
);

-- 5. PLAYER RESOURCE INVENTORY
create table public.player_resources (
    profile_id uuid not null references public.profiles(id) on delete cascade,
    resource_id int not null references public.resources(id) on delete cascade,
    quantity int not null default 0 check (quantity >= 0),
    primary key (profile_id, resource_id)
);

-- 6. ENERGY CHANGE AUDITS
create table public.energy_history (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid not null references public.profiles(id) on delete cascade,
    change_amount int not null,
    reason text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. RESOURCE GATHERING LOGS
create table public.gather_logs (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid not null references public.profiles(id) on delete cascade,
    region_id int not null references public.regions(id) on delete cascade,
    resource_id int not null references public.resources(id) on delete cascade,
    quantity_gathered int not null check (quantity_gathered >= 0),
    energy_spent int not null check (energy_spent >= 0),
    experience_earned int not null check (experience_earned >= 0),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. INDEXES FOR ECONOMY LOGS & INVENTORIES
create index idx_player_resources_profile on public.player_resources(profile_id);
create index idx_resource_spawn_region on public.resource_spawn_tables(region_id);
create index idx_gather_logs_profile on public.gather_logs(profile_id);
create index idx_energy_history_profile on public.energy_history(profile_id);

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.resources enable row level security;
alter table public.experience_tables enable row level security;
alter table public.resource_spawn_tables enable row level security;
alter table public.player_resources enable row level security;
alter table public.energy_history enable row level security;
alter table public.gather_logs enable row level security;

-- Resources Policies
create policy "Resources viewable by everyone" on public.resources for select using (true);
create policy "Resources modifiable by Admin" on public.resources for all using (public.is_admin());

-- Experience Tables Policies
create policy "Exp thresholds viewable by everyone" on public.experience_tables for select using (true);
create policy "Exp thresholds modifiable by Admin" on public.experience_tables for all using (public.is_admin());

-- Resource Spawns Policies
create policy "Spawns viewable by everyone" on public.resource_spawn_tables for select using (true);
create policy "Spawns modifiable by Admin" on public.resource_spawn_tables for all using (public.is_admin());

-- Player Resources Policies
create policy "Users can view own resources" on public.player_resources for select using (auth.uid() = profile_id);
create policy "System updates player resources" on public.player_resources for all using (auth.uid() = profile_id or public.is_admin());

-- Energy History Policies
create policy "Users can view own energy history" on public.energy_history for select using (auth.uid() = profile_id);
create policy "System writes energy history" on public.energy_history for insert with check (auth.uid() = profile_id or auth.uid() is null);

-- Gather Logs Policies
create policy "Users can view own gather logs" on public.gather_logs for select using (auth.uid() = profile_id);
create policy "System writes gather logs" on public.gather_logs for insert with check (auth.uid() = profile_id or auth.uid() is null);


-- 10. SEED CONFIGURATION DATA

-- Seed Resources
insert into public.resources (id, name, icon, description, rarity, category, weight, base_value, stack_limit)
values
  (1, 'Wood', 'Trees', 'Raw timber harvested from forestry areas.', 'common', 'raw', 0.20, 1.5, 999),
  (2, 'Stone', 'Gem', 'Sturdy rock mined from quarries.', 'common', 'raw', 0.50, 1.0, 999),
  (3, 'Iron Ore', 'Hammer', 'Dense reddish rock containing unrefined iron.', 'common', 'raw', 0.80, 4.0, 999),
  (4, 'Coal', 'Flame', 'Fossil fuels used to smelt ores.', 'common', 'raw', 0.40, 2.0, 999),
  (5, 'Grain', 'Wheat', 'Grown fields processed into food supplies.', 'common', 'raw', 0.15, 1.2, 999),
  (6, 'Fish', 'Fish', 'Freshwater catch for dietary needs.', 'common', 'raw', 0.25, 2.0, 999),
  (7, 'Water', 'Droplet', 'Filtered liquid resource.', 'common', 'raw', 0.10, 0.5, 999),
  (8, 'Oil', 'Container', 'Unrefined petroleum pumped from reserves.', 'uncommon', 'raw', 0.60, 8.0, 999),
  (9, 'Copper', 'Hammer', 'Soft metal ore for wiring and alloys.', 'common', 'raw', 0.50, 3.0, 999),
  (10, 'Cotton', 'Scissors', 'Plant fibers gathered for textile looms.', 'common', 'raw', 0.10, 1.8, 999)
on conflict (id) do update set
  name = excluded.name, icon = excluded.icon, description = excluded.description,
  rarity = excluded.rarity, category = excluded.category, weight = excluded.weight,
  base_value = excluded.base_value, stack_limit = excluded.stack_limit;

-- Seed Level Thresholds (1 to 100)
do $$
declare
  lvl int;
  req bigint;
begin
  for lvl in 1..100 loop
    req := lvl * lvl * 100;
    insert into public.experience_tables (level, required_experience)
    values (lvl, req)
    on conflict (level) do update set required_experience = excluded.required_experience;
  end loop;
end;
$$;

-- Update Region 1 & Seed Country and Region 2-10
insert into public.countries (id, name, gold_reserve, local_currency_reserve)
values
  (2, 'Iron Union', 8000.0, 800000.0),
  (3, 'Grain Republic', 4000.0, 400000.0)
on conflict (id) do nothing;

-- Update Region 1 (Genesis Capital)
update public.regions
set climate = 'temperate', population = 1200, production_bonus = 1.00, travel_cost = 10, travel_cooldown = 60
where id = 1;

-- Seed Regions 2 to 10
insert into public.regions (id, name, country_id, climate, population, production_bonus, travel_cost, travel_cooldown)
values
  (2, 'Emerald Woodlands', 1, 'temperate', 300, 1.20, 10, 60),
  (3, 'Granite Quarry', 1, 'rocky', 150, 1.15, 12, 90),
  (4, 'Great Ocean', 1, 'marine', 50, 1.05, 15, 120),
  
  (5, 'Steel Bastion', 2, 'cold', 850, 1.10, 10, 60),
  (6, 'Rust Coast', 2, 'coastal', 400, 1.00, 12, 90),
  (7, 'Obsidian Peaks', 2, 'volcanic', 120, 1.35, 18, 180),
  
  (8, 'Agraria Meadows', 3, 'lush', 700, 1.25, 10, 60),
  (9, 'Flatbeds', 3, 'arid', 180, 1.10, 14, 100),
  (10, 'Whispering Forests', 3, 'forest', 280, 1.15, 11, 75)
on conflict (id) do update set
  name = excluded.name, country_id = excluded.country_id, climate = excluded.climate,
  population = excluded.population, production_bonus = excluded.production_bonus,
  travel_cost = excluded.travel_cost, travel_cooldown = excluded.travel_cooldown;

-- Seed Spawns mapping regions to resources
insert into public.resource_spawn_tables (region_id, resource_id, spawn_weight, energy_cost, production_time, experience_reward)
values
  -- Genesis Capital (none)
  
  -- Emerald Woodlands (Wood, Water, Grain)
  (2, 1, 1.20, 10, 4, 10), -- Wood
  (2, 7, 1.00, 5, 2, 5),  -- Water
  (2, 5, 0.80, 12, 5, 12), -- Grain
  
  -- Granite Quarry (Stone, Copper, Coal)
  (3, 2, 1.30, 12, 5, 12), -- Stone
  (3, 9, 0.90, 15, 6, 15), -- Copper
  (3, 4, 1.00, 10, 4, 10), -- Coal
  
  -- Great Ocean (Fish, Water)
  (4, 6, 1.50, 15, 6, 15), -- Fish
  (4, 7, 1.10, 5, 2, 5),  -- Water
  
  -- Steel Bastion (Iron Ore, Coal)
  (5, 3, 1.40, 15, 6, 15), -- Iron Ore
  (5, 4, 1.10, 10, 4, 10), -- Coal
  
  -- Rust Coast (Fish, Stone)
  (6, 6, 1.10, 12, 5, 12), -- Fish
  (6, 2, 1.00, 10, 4, 10), -- Stone
  
  -- Obsidian Peaks (Copper, Iron Ore, Stone)
  (7, 9, 1.20, 15, 6, 15), -- Copper
  (7, 3, 1.10, 18, 7, 18), -- Iron Ore
  (7, 2, 0.80, 10, 4, 10), -- Stone
  
  -- Agraria Meadows (Grain, Cotton, Water)
  (8, 5, 1.40, 10, 4, 10), -- Grain
  (8, 10, 1.20, 10, 4, 10), -- Cotton
  (8, 7, 0.90, 5, 2, 5),  -- Water
  
  -- Flatbeds (Oil, Coal)
  (9, 8, 1.30, 20, 8, 25), -- Oil
  (9, 4, 0.90, 10, 4, 10), -- Coal
  
  -- Whispering Forests (Wood, Fish, Cotton)
  (10, 1, 1.30, 10, 4, 10), -- Wood
  (10, 6, 0.90, 12, 5, 12), -- Fish
  (10, 10, 0.80, 10, 4, 10) -- Cotton
on conflict (region_id, resource_id) do update set
  spawn_weight = excluded.spawn_weight, energy_cost = excluded.energy_cost,
  production_time = excluded.production_time, experience_reward = excluded.experience_reward;


-- 11. TRANSACTION GATHER RPC FUNCTION
create or replace function public.rpc_gather_resource(target_resource_id int)
returns json
security definer set search_path = public
language plpgsql as $$
declare
  current_user_id uuid;
  user_region_id int;
  spawn_cfg record;
  stat_rec record;
  curr_energy int;
  base_energy_regen int;
  ticks int;
  last_update timestamp with time zone;
  elapsed_secs numeric;
  qty_gathered int;
  new_level int;
  new_exp bigint;
  required_exp bigint;
  leveled_up boolean := false;
  weight_unit numeric;
  res_name text;
begin
  -- 1. Authentication Check
  current_user_id := auth.uid();
  if current_user_id is null then
    return json_build_object('success', false, 'error', 'Unauthenticated player session.');
  end if;

  -- 2. Fetch User Physical Region
  select current_region_id into user_region_id from public.profiles where id = current_user_id;
  if user_region_id is null then
    return json_build_object('success', false, 'error', 'Player region coordinates not found.');
  end if;

  -- 3. Verify Resource Spawn in Region
  select s.*, r.name as resource_name, r.weight as resource_weight
  into spawn_cfg
  from public.resource_spawn_tables s
  join public.resources r on r.id = s.resource_id
  where s.region_id = user_region_id and s.resource_id = target_resource_id and r.enabled = true;
  
  if spawn_cfg.resource_id is null then
    return json_build_object('success', false, 'error', 'This resource is not available in your current region.');
  end if;

  -- 4. Lock Player Stats Row for Concurrency Prevention
  select * into stat_rec from public.player_stats where profile_id = current_user_id for update;
  if stat_rec.profile_id is null then
    return json_build_object('success', false, 'error', 'Stats profile not found.');
  end if;

  -- 5. Sync Offline Energy ticks (5 EP per 6 minutes = 360 seconds)
  last_update := stat_rec.updated_at;
  elapsed_secs := extract(epoch from (now() - last_update));
  ticks := floor(elapsed_secs / 360);
  curr_energy := stat_rec.energy;

  if ticks > 0 and curr_energy < 100 then
    curr_energy := least(100, curr_energy + (ticks * 5));
    -- Log energy regen tick history
    insert into public.energy_history (profile_id, change_amount, reason)
    values (current_user_id, curr_energy - stat_rec.energy, 'offline_regen');
  end if;

  -- 6. Energy Cost Validation
  if curr_energy < spawn_cfg.energy_cost then
    return json_build_object('success', false, 'error', 'Insufficient energy. Gathering requires ' || spawn_cfg.energy_cost || ' EP.');
  end if;

  -- 7. Deduct energy and write history logs
  curr_energy := curr_energy - spawn_cfg.energy_cost;
  insert into public.energy_history (profile_id, change_amount, reason)
  values (current_user_id, -spawn_cfg.energy_cost, 'gathering_' || spawn_cfg.resource_name);

  -- 8. Yield Production Calculations
  -- yield = floor(1 + work_skill * 0.05 * spawn_weight)
  qty_gathered := floor(1 + stat_rec.work_skill * 0.05 * spawn_cfg.spawn_weight)::int;

  -- 9. Increment Player Resources (Inventory stack)
  insert into public.player_resources (profile_id, resource_id, quantity)
  values (current_user_id, target_resource_id, qty_gathered)
  on conflict (profile_id, resource_id) 
  do update set quantity = public.player_resources.quantity + excluded.quantity;

  -- 10. EXP & Leveling Logic via experience_tables Configs
  new_exp := stat_rec.experience + spawn_cfg.experience_reward;
  new_level := stat_rec.level;
  
  loop
    select required_experience into required_exp from public.experience_tables where level = new_level;
    if required_exp is null then
      exit; -- Max level threshold exceeded
    end if;

    if new_exp >= required_exp then
      new_exp := new_exp - required_exp;
      new_level := new_level + 1;
      leveled_up := true;
      curr_energy := 100; -- Full energy restore on level up!
    else
      exit;
    end if;
  end loop;

  -- 11. Commit Stats Updates
  update public.player_stats
  set 
    level = new_level,
    experience = new_exp,
    energy = curr_energy,
    work_skill = work_skill + 0.1000, -- labor experience skill-up
    updated_at = now()
  where profile_id = current_user_id;

  -- 12. Create Gather log & Audit log
  insert into public.gather_logs (profile_id, region_id, resource_id, quantity_gathered, energy_spent, experience_earned)
  values (current_user_id, user_region_id, target_resource_id, qty_gathered, spawn_cfg.energy_cost, spawn_cfg.experience_reward);

  insert into public.audit_logs (profile_id, action, metadata)
  values (current_user_id, 'resource.gather', jsonb_build_object(
    'resource_name', spawn_cfg.resource_name,
    'quantity', qty_gathered,
    'energy_spent', spawn_cfg.energy_cost,
    'experience_earned', spawn_cfg.experience_reward,
    'leveled_up', leveled_up
  ));

  return json_build_object(
    'success', true,
    'gathered_quantity', qty_gathered,
    'energy_spent', spawn_cfg.energy_cost,
    'experience_gained', spawn_cfg.experience_reward,
    'leveled_up', leveled_up,
    'new_level', new_level,
    'new_energy', curr_energy
  );
exception when others then
  return json_build_object('success', false, 'error', 'Gathering transaction aborted: ' || SQLERRM);
end;
$$;
