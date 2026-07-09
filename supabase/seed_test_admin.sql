-- =============================================================================
-- TEST ADMIN SEED — FOR DEVELOPMENT & TESTING ONLY
-- =============================================================================
-- ⚠️  WARNING: DO NOT RUN THIS IN PRODUCTION.
-- This script creates a test admin account with a known password for local
-- development and E2E testing purposes only.
--
-- Credentials:
--   Email    : admin@test.persistentmmo.dev
--   Password : AdminTest123!
--   Role     : super_admin
--
-- Usage:
--   Local:  supabase db reset  (seed.sql is picked up automatically)
--           OR run manually: psql $DATABASE_URL -f supabase/seed_test_admin.sql
--   CI/CD:  sourced by the test setup script (tests/setup/seed_admin.sh)
-- =============================================================================

do $$
declare
  v_user_id uuid := gen_random_uuid();
begin

  -- 1. Create the auth user (idempotent)
  if not exists (
    select 1 from auth.users where email = 'admin@test.persistentmmo.dev'
  ) then

    insert into auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token,
      is_super_admin, is_sso_user
    ) values (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'admin@test.persistentmmo.dev',
      crypt('AdminTest123!', gen_salt('bf')),
      now(),
      jsonb_build_object('username', 'TestAdmin', 'is_test_account', true),
      now(), now(), '', '', false, false
    );

    -- Identity row required for GoTrue email auth
    insert into auth.identities (
      id, user_id, provider_id, provider,
      identity_data, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id,
      'admin@test.persistentmmo.dev', 'email',
      jsonb_build_object('sub', v_user_id::text, 'email', 'admin@test.persistentmmo.dev'),
      now(), now(), now()
    );

  else
    select id into v_user_id
    from auth.users
    where email = 'admin@test.persistentmmo.dev';
  end if;

  -- 2. Elevate profile to super_admin
  update public.profiles
  set role = 'super_admin', username = 'TestAdmin'
  where id = v_user_id;

  raise notice 'Test admin account ready — id: %', v_user_id;

end $$;
