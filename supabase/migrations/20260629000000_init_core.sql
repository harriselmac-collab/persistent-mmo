-- Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- 1. COUNTRIES & REGIONS (Minimal Gameplay Placeholders)
create table public.countries (
    id serial primary key,
    name text not null unique check (char_length(name) >= 2 and char_length(name) <= 50),
    gold_reserve numeric(16,4) not null default 1000.0000 check (gold_reserve >= 0),
    local_currency_reserve numeric(18,2) not null default 100000.00 check (local_currency_reserve >= 0),
    vat_rate numeric(4,2) not null default 10.00 check (vat_rate >= 0 and vat_rate <= 100),
    import_tax_rate numeric(4,2) not null default 10.00 check (import_tax_rate >= 0 and import_tax_rate <= 100),
    income_tax_rate numeric(4,2) not null default 10.00 check (income_tax_rate >= 0 and income_tax_rate <= 100),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.regions (
    id serial primary key,
    name text not null check (char_length(name) >= 2 and char_length(name) <= 50),
    country_id int not null references public.countries(id) on delete restrict,
    resource_type text check (resource_type in ('grain', 'iron', 'oil', 'none')),
    resource_abundance numeric(3,2) not null default 1.00 check (resource_abundance >= 0 and resource_abundance <= 2.00),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed one default country and region for registration default fallback
insert into public.countries (id, name, gold_reserve, local_currency_reserve)
values (1, 'Genesis Land', 5000.0000, 500000.00)
on conflict do nothing;

insert into public.regions (id, name, country_id, resource_type, resource_abundance)
values (1, 'Genesis Capital', 1, 'none', 1.00)
on conflict do nothing;


-- 2. CORE USER TABLES

-- Profiles
create table public.profiles (
    id uuid primary key references auth.users on delete cascade,
    username text not null unique check (char_length(username) >= 3 and char_length(username) <= 30 and username ~ '^[a-zA-Z0-9_-]+$'),
    avatar_url text,
    citizenship_country_id int references public.countries(id) on delete set null default 1,
    current_region_id int references public.regions(id) on delete set null default 1,
    role text not null default 'player' check (role in ('super_admin', 'game_master', 'moderator', 'support', 'player')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Player Stats
create table public.player_stats (
    profile_id uuid primary key references public.profiles(id) on delete cascade,
    level int not null default 1 check (level >= 1),
    experience bigint not null default 0 check (experience >= 0),
    energy int not null default 100 check (energy >= 0 and energy <= 100),
    strength numeric(12,4) not null default 1.0000 check (strength >= 0),
    work_skill numeric(12,4) not null default 1.0000 check (work_skill >= 0),
    last_work_at timestamp with time zone,
    last_train_at timestamp with time zone,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Currencies
create table public.currencies (
    profile_id uuid primary key references public.profiles(id) on delete cascade,
    gold numeric(16,4) not null default 0.0000 check (gold >= 0),
    local_currency_balance numeric(18,2) not null default 100.00 check (local_currency_balance >= 0),
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Settings
create table public.settings (
    profile_id uuid primary key references public.profiles(id) on delete cascade,
    theme text not null default 'dark' check (theme in ('dark', 'light')),
    language text not null default 'en' check (char_length(language) = 2),
    email_notifications boolean not null default true,
    sound_effects boolean not null default true,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Inventories
create table public.inventories (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references public.profiles(id) on delete cascade,
    item_template_id int not null,
    quantity int not null default 1 check (quantity >= 0),
    quality int not null default 1 check (quality >= 1 and quality <= 5),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint uq_owner_template_quality unique (owner_id, item_template_id, quality)
);

-- Equipment
create table public.equipment (
    profile_id uuid primary key references public.profiles(id) on delete cascade,
    weapon_id uuid references public.inventories(id) on delete set null,
    tool_id uuid references public.inventories(id) on delete set null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. AUDIT & LOGGING
create table public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid references public.profiles(id) on delete set null,
    action text not null,
    metadata jsonb not null default '{}'::jsonb,
    ip_address text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Feature Flags
create table public.feature_flags (
    key text primary key check (char_length(key) >= 2 and char_length(key) <= 50),
    value boolean not null default false,
    description text,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. SYSTEM SYSTEMS
create table public.notifications (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid not null references public.profiles(id) on delete cascade,
    title text not null,
    message text not null,
    type text not null check (type in ('system', 'marketplace', 'combat', 'economy', 'politics', 'guilds', 'messages', 'achievements')),
    is_read boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.achievements (
    id serial primary key,
    name text not null unique check (char_length(name) >= 3 and char_length(name) <= 50),
    description text not null,
    badge_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.player_achievements (
    profile_id uuid not null references public.profiles(id) on delete cascade,
    achievement_id int not null references public.achievements(id) on delete cascade,
    unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (profile_id, achievement_id)
);


-- 5. TRIGGER FOR AUTO-UPDATED AT
create or replace function public.trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_timestamp_profiles before update on public.profiles for each row execute procedure public.trigger_set_timestamp();
create trigger set_timestamp_player_stats before update on public.player_stats for each row execute procedure public.trigger_set_timestamp();
create trigger set_timestamp_currencies before update on public.currencies for each row execute procedure public.trigger_set_timestamp();
create trigger set_timestamp_settings before update on public.settings for each row execute procedure public.trigger_set_timestamp();
create trigger set_timestamp_inventories before update on public.inventories for each row execute procedure public.trigger_set_timestamp();
create trigger set_timestamp_equipment before update on public.equipment for each row execute procedure public.trigger_set_timestamp();
create trigger set_timestamp_feature_flags before update on public.feature_flags for each row execute procedure public.trigger_set_timestamp();


-- 6. TRANSACTIONAL SIGNUP PROVISIONING TRIGGER
create or replace function public.handle_new_user()
returns trigger
security definer set search_path = public
language plpgsql as $$
declare
  default_username text;
  username_exists boolean;
  rand_suffix int;
begin
  -- Resolve username from metadata or random string
  default_username := coalesce(
    new.raw_user_meta_data->>'username',
    'player_' || substr(md5(random()::text), 1, 8)
  );

  -- Sanitize username format (strip invalid chars)
  default_username := regexp_replace(default_username, '[^a-zA-Z0-9_-]', '', 'g');
  if char_length(default_username) < 3 then
    default_username := 'player_' || substr(md5(random()::text), 1, 6);
  end if;

  -- Ensure username uniqueness loop
  loop
    select exists(select 1 from public.profiles where username = default_username) into username_exists;
    if not username_exists then
      exit;
    end if;
    rand_suffix := floor(random() * 10000)::int;
    default_username := substr(default_username, 1, 20) || rand_suffix::text;
  end loop;

  -- 1. Insert Profile
  insert into public.profiles (id, username, role)
  values (new.id, default_username, 'player');

  -- 2. Insert Player Stats
  insert into public.player_stats (profile_id, level, experience, energy, strength, work_skill)
  values (new.id, 1, 0, 100, 1.0000, 1.0000);

  -- 3. Insert Currencies
  insert into public.currencies (profile_id, gold, local_currency_balance)
  values (new.id, 0.0000, 100.00);

  -- 4. Insert Settings
  insert into public.settings (profile_id, theme, language, email_notifications, sound_effects)
  values (new.id, 'dark', 'en', true, true);

  -- 5. Insert Equipment
  insert into public.equipment (profile_id, weapon_id, tool_id)
  values (new.id, null, null);

  -- 6. Log Signup
  insert into public.audit_logs (profile_id, action, metadata)
  values (new.id, 'auth.signup', jsonb_build_object('email', new.email));

  return new;
exception when others then
  -- Transaction will roll back automatically on error
  raise warning 'Error in handle_new_user provisioning: %', SQLERRM;
  return null;
end;
$$;

-- Trigger binding
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 7. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.profiles enable row level security;
alter table public.player_stats enable row level security;
alter table public.currencies enable row level security;
alter table public.settings enable row level security;
alter table public.inventories enable row level security;
alter table public.equipment enable row level security;
alter table public.audit_logs enable row level security;
alter table public.feature_flags enable row level security;
alter table public.notifications enable row level security;
alter table public.countries enable row level security;
alter table public.regions enable row level security;
alter table public.achievements enable row level security;
alter table public.player_achievements enable row level security;

-- Helper function to check if current authenticated user has administrative credentials
create or replace function public.is_admin()
returns boolean security definer set search_path = public as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('super_admin', 'game_master', 'moderator', 'support')
  );
end;
$$ language plpgsql;

-- Profiles Policies
create policy "Public Profiles viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own Profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins have full access to Profiles" on public.profiles for all using (public.is_admin());

-- Player Stats Policies
create policy "Stats viewable by everyone" on public.player_stats for select using (true);
create policy "Stats only modifiable by systems/admin" on public.player_stats for all using (public.is_admin());

-- Currencies Policies
create policy "Users can view own balances" on public.currencies for select using (auth.uid() = profile_id);
create policy "Balances only modifiable by systems/admin" on public.currencies for all using (public.is_admin());

-- Settings Policies
create policy "Users can view own Settings" on public.settings for select using (auth.uid() = profile_id);
create policy "Users can update own Settings" on public.settings for update using (auth.uid() = profile_id);

-- Inventories Policies
create policy "Users can view own Inventories" on public.inventories for select using (auth.uid() = owner_id);
create policy "Inventories only modifiable by systems/admin" on public.inventories for all using (public.is_admin());

-- Equipment Policies
create policy "Equipment viewable by everyone" on public.equipment for select using (true);
create policy "Users can update own Equipment" on public.equipment for update using (auth.uid() = profile_id);

-- Audit Logs Policies
create policy "Users can view own Audit Logs" on public.audit_logs for select using (auth.uid() = profile_id);
create policy "System writes Audit Logs" on public.audit_logs for insert with check (auth.uid() = profile_id or auth.uid() is null);

-- Feature Flags Policies
create policy "Feature Flags viewable by everyone" on public.feature_flags for select using (true);
create policy "Feature Flags modifiable by Admin" on public.feature_flags for all using (public.is_admin());

-- Notifications Policies
create policy "Users can view own Notifications" on public.notifications for select using (auth.uid() = profile_id);
create policy "Users can update read status of own notifications" on public.notifications for update using (auth.uid() = profile_id);
create policy "System creates notifications" on public.notifications for insert with check (true);

-- Countries/Regions Policies
create policy "Countries viewable by everyone" on public.countries for select using (true);
create policy "Regions viewable by everyone" on public.regions for select using (true);
create policy "Countries and Regions modifiable by Admin" on public.countries for all using (public.is_admin());
create policy "Regions modifiable by Admin" on public.regions for all using (public.is_admin());

-- Achievements Policies
create policy "Achievements viewable by everyone" on public.achievements for select using (true);
create policy "Achievements modifiable by Admin" on public.achievements for all using (public.is_admin());
create policy "Player Achievements viewable by everyone" on public.player_achievements for select using (true);


-- 8. OPTIMIZING INDEXES FOR HIGH-THROUGHPUT LOOKUPS
create index idx_profiles_username on public.profiles(username);
create index idx_inventories_owner_template_quality on public.inventories(owner_id, item_template_id, quality);
create index idx_notifications_profile_unread on public.notifications(profile_id) where is_read = false;
create index idx_audit_logs_profile_action on public.audit_logs(profile_id, action);
create index idx_player_achievements_profile on public.player_achievements(profile_id);
