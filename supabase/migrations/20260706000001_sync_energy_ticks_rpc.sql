-- Description: Adds sync_energy_ticks RPC for offline energy synchronization.
CREATE OR REPLACE FUNCTION public.sync_energy_ticks()
RETURNS public.player_stats
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  current_user_id UUID;
  stat_rec public.player_stats;
  curr_energy INT;
  ticks INT;
  elapsed_secs NUMERIC;
  energy_gained INT;
BEGIN
  -- 1. Authentication Check
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 2. Lock Row for Concurrency Prevention
  SELECT * INTO stat_rec FROM public.player_stats WHERE profile_id = current_user_id FOR UPDATE;
  IF stat_rec.profile_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 3. Calculate offline ticks (5 EP per 6 minutes = 360 seconds)
  elapsed_secs := extract(epoch from (now() - stat_rec.updated_at));
  ticks := floor(elapsed_secs / 360);
  curr_energy := stat_rec.energy;

  IF ticks > 0 AND curr_energy < 100 THEN
    energy_gained := least(100, curr_energy + (ticks * 5)) - curr_energy;
    IF energy_gained > 0 THEN
      curr_energy := curr_energy + energy_gained;
      
      -- Update player stats timestamp and energy level
      UPDATE public.player_stats
      SET energy = curr_energy, updated_at = now()
      WHERE profile_id = current_user_id;

      -- Write to regen tick audit log
      INSERT INTO public.energy_history (profile_id, change_amount, reason)
      VALUES (current_user_id, energy_gained, 'offline_regen');
      
      -- Reload record for return statement
      SELECT * INTO stat_rec FROM public.player_stats WHERE profile_id = current_user_id;
    END IF;
  END IF;

  RETURN stat_rec;
END;
$$;
