-- TRAVEL RPC FUNCTION
-- Moves a player between regions. Rules mirror MockGameRepository.travelToRegion
-- and the map UI: 10 EP same-country, 20 EP + 1 Travel Ticket (item template 3)
-- when changing countries.

create or replace function public.travel_to_region(target_region_id int)
returns json
security definer set search_path = public
language plpgsql as $$
declare
  current_user_id uuid;
  profile_rec record;
  current_region record;
  target_region record;
  stat_rec record;
  curr_energy int;
  ticks int;
  elapsed_secs numeric;
  is_same_country boolean;
  energy_cost int;
  ticket_rec record;
begin
  -- 1. Authentication Check
  current_user_id := auth.uid();
  if current_user_id is null then
    return json_build_object('success', false, 'error', 'Unauthenticated player session.');
  end if;

  -- 2. Load profile and regions
  select * into profile_rec from public.profiles where id = current_user_id;
  if profile_rec.id is null then
    return json_build_object('success', false, 'error', 'Character data not found.');
  end if;

  select * into target_region from public.regions where id = target_region_id;
  if target_region.id is null then
    return json_build_object('success', false, 'error', 'Target region does not exist.');
  end if;

  if profile_rec.current_region_id = target_region_id then
    return json_build_object('success', false, 'error', 'You are already in this region.');
  end if;

  select * into current_region from public.regions where id = profile_rec.current_region_id;
  if current_region.id is null then
    return json_build_object('success', false, 'error', 'Current region not found.');
  end if;

  is_same_country := current_region.country_id = target_region.country_id;
  energy_cost := case when is_same_country then 10 else 20 end;

  -- 3. Lock Player Stats Row for Concurrency Prevention
  select * into stat_rec from public.player_stats where profile_id = current_user_id for update;
  if stat_rec.profile_id is null then
    return json_build_object('success', false, 'error', 'Stats profile not found.');
  end if;

  -- 4. Sync Offline Energy ticks (5 EP per 6 minutes, same as rpc_gather_resource)
  elapsed_secs := extract(epoch from (now() - stat_rec.updated_at));
  ticks := floor(elapsed_secs / 360);
  curr_energy := stat_rec.energy;

  if ticks > 0 and curr_energy < 100 then
    curr_energy := least(100, curr_energy + (ticks * 5));
    insert into public.energy_history (profile_id, change_amount, reason)
    values (current_user_id, curr_energy - stat_rec.energy, 'offline_regen');
  end if;

  -- 5. Energy Cost Validation
  if curr_energy < energy_cost then
    return json_build_object('success', false, 'error', 'Insufficient energy. Traveling requires ' || energy_cost || ' energy.');
  end if;

  -- 6. Cross-country travel consumes one Travel Ticket
  if not is_same_country then
    select * into ticket_rec from public.inventories
    where owner_id = current_user_id and item_template_id = 3 and quantity > 0
    order by quality asc
    limit 1
    for update;

    if ticket_rec.id is null then
      return json_build_object('success', false, 'error', 'Changing countries requires 1 Travel Ticket.');
    end if;

    update public.inventories
    set quantity = quantity - 1, updated_at = now()
    where id = ticket_rec.id;
  end if;

  -- 7. Deduct energy, move player, write logs
  update public.player_stats
  set energy = curr_energy - energy_cost, updated_at = now()
  where profile_id = current_user_id;

  insert into public.energy_history (profile_id, change_amount, reason)
  values (current_user_id, -energy_cost, 'travel_' || target_region.name);

  update public.profiles
  set current_region_id = target_region_id, updated_at = now()
  where id = current_user_id;

  insert into public.audit_logs (profile_id, action, metadata)
  values (current_user_id, 'region.travel', jsonb_build_object(
    'from', current_region.name,
    'to', target_region.name,
    'energy_cost', energy_cost,
    'ticket_used', not is_same_country
  ));

  return json_build_object('success', true, 'error', null);
end;
$$;
