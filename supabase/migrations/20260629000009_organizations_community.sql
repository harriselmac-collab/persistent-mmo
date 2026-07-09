-- ========================================================
-- PHASE 11: ORGANIZATIONS, COMMUNITY, DIPLOMACY & SOCIETY
-- ========================================================

-- 1. Guilds
CREATE TABLE IF NOT EXISTS public.guilds (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  tag VARCHAR(10) NOT NULL UNIQUE,
  description TEXT,
  leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  treasury_local NUMERIC(20, 2) NOT NULL DEFAULT 0.00 CHECK (treasury_local >= 0),
  treasury_gold NUMERIC(20, 2) NOT NULL DEFAULT 0.00 CHECK (treasury_gold >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- 2. Guild Roles
CREATE TABLE IF NOT EXISTS public.guild_roles (
  id SERIAL PRIMARY KEY,
  guild_id INT REFERENCES public.guilds(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  is_custom BOOLEAN DEFAULT TRUE NOT NULL,
  rank_priority INT NOT NULL DEFAULT 0,
  UNIQUE(guild_id, name)
);

-- 3. Guild Permissions
CREATE TABLE IF NOT EXISTS public.guild_permissions (
  role_id INT PRIMARY KEY REFERENCES public.guild_roles(id) ON DELETE CASCADE,
  can_invite BOOLEAN NOT NULL DEFAULT FALSE,
  can_kick BOOLEAN NOT NULL DEFAULT FALSE,
  can_promote BOOLEAN NOT NULL DEFAULT FALSE,
  can_withdraw_funds BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_roles BOOLEAN NOT NULL DEFAULT FALSE,
  can_post_announcements BOOLEAN NOT NULL DEFAULT FALSE
);

-- 4. Guild Members
CREATE TABLE IF NOT EXISTS public.guild_members (
  guild_id INT REFERENCES public.guilds(id) ON DELETE CASCADE,
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id INT REFERENCES public.guild_roles(id) ON DELETE SET NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- 5. Guild Inventory
CREATE TABLE IF NOT EXISTS public.guild_inventory (
  id SERIAL PRIMARY KEY,
  guild_id INT REFERENCES public.guilds(id) ON DELETE CASCADE,
  item_template_id INT REFERENCES public.item_templates(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  UNIQUE(guild_id, item_template_id)
);

-- 6. Guild Applications
CREATE TABLE IF NOT EXISTS public.guild_applications (
  id SERIAL PRIMARY KEY,
  guild_id INT REFERENCES public.guilds(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  UNIQUE(guild_id, profile_id, status)
);

-- 7. Guild Invitations
CREATE TABLE IF NOT EXISTS public.guild_invitations (
  id SERIAL PRIMARY KEY,
  guild_id INT REFERENCES public.guilds(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  UNIQUE(guild_id, profile_id, status)
);

-- 8. Guild Wars & Alliances
CREATE TABLE IF NOT EXISTS public.guild_wars (
  id SERIAL PRIMARY KEY,
  attacker_guild_id INT REFERENCES public.guilds(id) ON DELETE CASCADE,
  defender_guild_id INT REFERENCES public.guilds(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.guild_alliances (
  id SERIAL PRIMARY KEY,
  guild_id_1 INT REFERENCES public.guilds(id) ON DELETE CASCADE,
  guild_id_2 INT REFERENCES public.guilds(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dissolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  UNIQUE(guild_id_1, guild_id_2)
);

-- 9. Coalitions & Coalition Members
CREATE TABLE IF NOT EXISTS public.coalitions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  founder_guild_id INT REFERENCES public.guilds(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.coalition_members (
  coalition_id INT REFERENCES public.coalitions(id) ON DELETE CASCADE,
  guild_id INT PRIMARY KEY REFERENCES public.guilds(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- 10. Friendships & Blocks
CREATE TABLE IF NOT EXISTS public.friendships (
  id SERIAL PRIMARY KEY,
  profile_id_1 UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_id_2 UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  UNIQUE(profile_id_1, profile_id_2)
);

CREATE TABLE IF NOT EXISTS public.player_blocks (
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  PRIMARY KEY (blocker_id, blocked_id)
);

-- 11. Conversation Threads & Messages
CREATE TABLE IF NOT EXISTS public.conversation_threads (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('private', 'group', 'guild', 'coalition', 'country', 'trade', 'system')),
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  thread_id INT REFERENCES public.conversation_threads(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  PRIMARY KEY (thread_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id SERIAL PRIMARY KEY,
  thread_id INT REFERENCES public.conversation_threads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  read_by_json JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 12. Player Mail
CREATE TABLE IF NOT EXISTS public.player_mail (
  id SERIAL PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  attached_currency NUMERIC(20, 2) NOT NULL DEFAULT 0.00 CHECK (attached_currency >= 0),
  attached_gold NUMERIC(20, 2) NOT NULL DEFAULT 0.00 CHECK (attached_gold >= 0),
  attached_item_template_id INT REFERENCES public.item_templates(id) ON DELETE SET NULL,
  attached_item_qty INT NOT NULL DEFAULT 0 CHECK (attached_item_qty >= 0),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- 13. Reputation, Titles, & Badges
CREATE TABLE IF NOT EXISTS public.player_reputation (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  trading_rep INT NOT NULL DEFAULT 0,
  military_rep INT NOT NULL DEFAULT 0,
  political_rep INT NOT NULL DEFAULT 0,
  industrial_rep INT NOT NULL DEFAULT 0,
  community_rep INT NOT NULL DEFAULT 0,
  moderation_history JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.player_titles (
  id SERIAL PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(100) NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'military', 'politics', 'industrial', 'event', 'custom'
  is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.player_badges (
  id SERIAL PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_name VARCHAR(100) NOT NULL,
  image_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- 14. Contracts & Escrow System
CREATE TABLE IF NOT EXISTS public.contracts (
  id SERIAL PRIMARY KEY,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('employment', 'supply', 'manufacturing', 'military', 'transportation', 'government', 'custom')),
  terms_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  escrow_local NUMERIC(20, 2) NOT NULL DEFAULT 0.00 CHECK (escrow_local >= 0),
  escrow_gold NUMERIC(20, 2) NOT NULL DEFAULT 0.00 CHECK (escrow_gold >= 0),
  deadline TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'offered' CHECK (status IN ('offered', 'active', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.contract_offers (
  id SERIAL PRIMARY KEY,
  contract_id INT REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  target_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_guild_id INT REFERENCES public.guilds(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.contract_executions (
  id SERIAL PRIMARY KEY,
  contract_id INT REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- 15. Recruitment Posts
CREATE TABLE IF NOT EXISTS public.recruitment_posts (
  id SERIAL PRIMARY KEY,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_type VARCHAR(30) NOT NULL CHECK (target_type IN ('guild', 'company', 'military', 'politics', 'volunteer')),
  target_id INT,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  requirements_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- 16. Newspapers, Articles, Comments & Announcements
CREATE TABLE IF NOT EXISTS public.newspapers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.articles (
  id SERIAL PRIMARY KEY,
  newspaper_id INT REFERENCES public.newspapers(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(30) NOT NULL CHECK (category IN ('news', 'opinion', 'government', 'developer')),
  ratings_score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.article_comments (
  id SERIAL PRIMARY KEY,
  article_id INT REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  commenter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id SERIAL PRIMARY KEY,
  sender_type VARCHAR(30) NOT NULL CHECK (sender_type IN ('system', 'government', 'guild', 'coalition')),
  sender_id VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- 17. Calendar Events
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(30) NOT NULL CHECK (type IN ('election', 'war', 'production', 'guild', 'developer', 'seasonal', 'maintenance', 'personal')),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- 18. Community Logs
CREATE TABLE IF NOT EXISTS public.community_logs (
  id SERIAL PRIMARY KEY,
  guild_id INT REFERENCES public.guilds(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- ========================================================
-- INDEXING
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_guild_members_guild ON public.guild_members(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_roles_guild ON public.guild_roles(guild_id);
CREATE INDEX IF NOT EXISTS idx_friendships_p1 ON public.friendships(profile_id_1);
CREATE INDEX IF NOT EXISTS idx_friendships_p2 ON public.friendships(profile_id_2);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON public.direct_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_participants_profile ON public.conversation_participants(profile_id);
CREATE INDEX IF NOT EXISTS idx_mail_recipient ON public.player_mail(recipient_id);
CREATE INDEX IF NOT EXISTS idx_articles_newspaper ON public.articles(newspaper_id);
CREATE INDEX IF NOT EXISTS idx_comments_article ON public.article_comments(article_id);

-- ========================================================
-- ENABLE ROW LEVEL SECURITY
-- ========================================================
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_wars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_alliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coalitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coalition_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_mail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newspapers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_logs ENABLE ROW LEVEL SECURITY;

-- Select policies for authenticated users
CREATE POLICY "Read guilds" ON public.guilds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read guild_roles" ON public.guild_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read guild_permissions" ON public.guild_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read guild_members" ON public.guild_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read guild_inventory" ON public.guild_inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read guild_applications" ON public.guild_applications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read guild_invitations" ON public.guild_invitations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read guild_wars" ON public.guild_wars FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read guild_alliances" ON public.guild_alliances FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read coalitions" ON public.coalitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read coalition_members" ON public.coalition_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read friendships" ON public.friendships FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read player_blocks" ON public.player_blocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read conversation_threads" ON public.conversation_threads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read conversation_participants" ON public.conversation_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read direct_messages" ON public.direct_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read player_mail" ON public.player_mail FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read player_reputation" ON public.player_reputation FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read player_titles" ON public.player_titles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read player_badges" ON public.player_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read contracts" ON public.contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read contract_offers" ON public.contract_offers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read contract_executions" ON public.contract_executions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read recruitment_posts" ON public.recruitment_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read newspapers" ON public.newspapers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read articles" ON public.articles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read article_comments" ON public.article_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read announcements" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read calendar_events" ON public.calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read community_logs" ON public.community_logs FOR SELECT TO authenticated USING (true);

-- ========================================================
-- SECURITY DEFINER RPC PROCEDURES
-- ========================================================

-- Create Guild
CREATE OR REPLACE FUNCTION public.rpc_create_guild(
  p_name VARCHAR(100),
  p_tag VARCHAR(10),
  p_description TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  existing_member INT;
  new_guild_id INT;
  leader_role_id INT;
  officer_role_id INT;
  member_role_id INT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  SELECT COUNT(*) INTO existing_member FROM public.guild_members WHERE profile_id = caller_id;
  IF existing_member > 0 THEN
    RETURN json_build_object('success', false, 'error', 'Player is already a member of a guild.');
  END IF;

  INSERT INTO public.guilds (name, tag, description, leader_id)
  VALUES (p_name, p_tag, p_description, caller_id)
  RETURNING id INTO new_guild_id;

  INSERT INTO public.guild_roles (guild_id, name, is_custom, rank_priority)
  VALUES 
    (new_guild_id, 'Leader', false, 100),
    (new_guild_id, 'Officer', false, 50),
    (new_guild_id, 'Member', false, 0)
  RETURNING id INTO leader_role_id;

  -- Select other roles IDs
  SELECT id INTO officer_role_id FROM public.guild_roles WHERE guild_id = new_guild_id AND name = 'Officer';
  SELECT id INTO member_role_id FROM public.guild_roles WHERE guild_id = new_guild_id AND name = 'Member';

  -- Permissions setup
  INSERT INTO public.guild_permissions (role_id, can_invite, can_kick, can_promote, can_withdraw_funds, can_manage_roles, can_post_announcements)
  VALUES 
    (leader_role_id, true, true, true, true, true, true),
    (officer_role_id, true, true, false, false, false, true),
    (member_role_id, false, false, false, false, false, false);

  -- Insert Member
  INSERT INTO public.guild_members (guild_id, profile_id, role_id)
  VALUES (new_guild_id, caller_id, leader_role_id);

  RETURN json_build_object('success', true, 'guild_id', new_guild_id);
EXCEPTION
  WHEN others THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Apply to Guild
CREATE OR REPLACE FUNCTION public.rpc_apply_to_guild(
  p_guild_id INT,
  p_message TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  existing_member INT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  SELECT COUNT(*) INTO existing_member FROM public.guild_members WHERE profile_id = caller_id;
  IF existing_member > 0 THEN
    RETURN json_build_object('success', false, 'error', 'Player is already a member of a guild.');
  END IF;

  INSERT INTO public.guild_applications (guild_id, profile_id, status, message)
  VALUES (p_guild_id, caller_id, 'pending', p_message)
  ON CONFLICT (guild_id, profile_id, status) DO NOTHING;

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN others THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Manage Guild Member (Kick, Promote, Demote)
CREATE OR REPLACE FUNCTION public.rpc_manage_guild_member(
  p_guild_id INT,
  p_target_profile_id UUID,
  p_action VARCHAR(20)
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  caller_role_id INT;
  caller_priority INT;
  target_role_id INT;
  target_priority INT;
  officer_role_id INT;
  member_role_id INT;
  can_execute BOOLEAN := false;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  -- Get caller role info
  SELECT gm.role_id, gr.rank_priority INTO caller_role_id, caller_priority
  FROM public.guild_members gm
  JOIN public.guild_roles gr ON gr.id = gm.role_id
  WHERE gm.guild_id = p_guild_id AND gm.profile_id = caller_id;

  IF caller_role_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'You are not in this guild.');
  END IF;

  -- Get target role info
  SELECT gm.role_id, gr.rank_priority INTO target_role_id, target_priority
  FROM public.guild_members gm
  JOIN public.guild_roles gr ON gr.id = gm.role_id
  WHERE gm.guild_id = p_guild_id AND gm.profile_id = p_target_profile_id;

  IF target_role_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Target is not a member of this guild.');
  END IF;

  -- Action checks
  IF p_action = 'kick' THEN
    SELECT can_kick INTO can_execute FROM public.guild_permissions WHERE role_id = caller_role_id;
    IF can_execute AND caller_priority > target_priority THEN
      DELETE FROM public.guild_members WHERE guild_id = p_guild_id AND profile_id = p_target_profile_id;
      RETURN json_build_object('success', true);
    ELSE
      RETURN json_build_object('success', false, 'error', 'Insufficient permissions to kick target.');
    END IF;

  ELSIF p_action = 'promote' THEN
    SELECT can_promote INTO can_execute FROM public.guild_permissions WHERE role_id = caller_role_id;
    IF can_execute AND caller_priority > target_priority THEN
      SELECT id INTO officer_role_id FROM public.guild_roles WHERE guild_id = p_guild_id AND name = 'Officer';
      UPDATE public.guild_members SET role_id = officer_role_id WHERE guild_id = p_guild_id AND profile_id = p_target_profile_id;
      RETURN json_build_object('success', true);
    ELSE
      RETURN json_build_object('success', false, 'error', 'Insufficient permissions to promote target.');
    END IF;

  ELSIF p_action = 'demote' THEN
    SELECT can_promote INTO can_execute FROM public.guild_permissions WHERE role_id = caller_role_id;
    IF can_execute AND caller_priority > target_priority THEN
      SELECT id INTO member_role_id FROM public.guild_roles WHERE guild_id = p_guild_id AND name = 'Member';
      UPDATE public.guild_members SET role_id = member_role_id WHERE guild_id = p_guild_id AND profile_id = p_target_profile_id;
      RETURN json_build_object('success', true);
    ELSE
      RETURN json_build_object('success', false, 'error', 'Insufficient permissions to demote target.');
    END IF;
  END IF;

  RETURN json_build_object('success', false, 'error', 'Invalid action.');
END;
$$ LANGUAGE plpgsql;

-- Send Direct Message
CREATE OR REPLACE FUNCTION public.rpc_send_direct_message(
  p_thread_id INT,
  p_content TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  is_participant INT;
  new_message_id INT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  SELECT COUNT(*) INTO is_participant
  FROM public.conversation_participants
  WHERE thread_id = p_thread_id AND profile_id = caller_id;

  IF is_participant = 0 THEN
    -- Check if thread is guild/country/trade/system
    DECLARE
      t_type VARCHAR(20);
    BEGIN
      SELECT type INTO t_type FROM public.conversation_threads WHERE id = p_thread_id;
      IF t_type IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Thread not found.');
      END IF;
      -- Let people post to trade/system or join country/guild threads if appropriate
      -- For simplicity, if not participating in private/group threads, return error
      IF t_type IN ('private', 'group') THEN
        RETURN json_build_object('success', false, 'error', 'You are not a participant in this conversation.');
      END IF;
    END;
  END IF;

  INSERT INTO public.direct_messages (thread_id, sender_id, content)
  VALUES (p_thread_id, caller_id, p_content)
  RETURNING id INTO new_message_id;

  RETURN json_build_object('success', true, 'message_id', new_message_id);
EXCEPTION
  WHEN others THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Send Mail
CREATE OR REPLACE FUNCTION public.rpc_send_mail(
  p_recipient_id UUID,
  p_subject VARCHAR(200),
  p_body TEXT,
  p_attached_currency NUMERIC(20, 2),
  p_attached_gold NUMERIC(20, 2),
  p_attached_item_template_id INT,
  p_attached_item_qty INT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  sender_local NUMERIC(20, 2);
  sender_gold NUMERIC(20, 2);
  has_item INT;
  new_mail_id INT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  -- Validate currencies
  SELECT balance_local, balance_gold INTO sender_local, sender_gold
  FROM public.currencies WHERE profile_id = caller_id;

  IF sender_local < p_attached_currency THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient local currency.');
  END IF;
  IF sender_gold < p_attached_gold THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient gold.');
  END IF;

  -- Validate item
  IF p_attached_item_template_id IS NOT NULL AND p_attached_item_qty > 0 THEN
    SELECT quantity INTO has_item FROM public.inventories
    WHERE owner_id = caller_id AND item_template_id = p_attached_item_template_id;

    IF has_item IS NULL OR has_item < p_attached_item_qty THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient item inventory.');
    END IF;
  END IF;

  -- Deduct currency
  UPDATE public.currencies
  SET balance_local = balance_local - p_attached_currency,
      balance_gold = balance_gold - p_attached_gold
  WHERE profile_id = caller_id;

  -- Deduct item
  IF p_attached_item_template_id IS NOT NULL AND p_attached_item_qty > 0 THEN
    UPDATE public.inventories
    SET quantity = quantity - p_attached_item_qty
    WHERE owner_id = caller_id AND item_template_id = p_attached_item_template_id;

    -- Clean up empty inventory rows
    DELETE FROM public.inventories WHERE owner_id = caller_id AND quantity <= 0;
  END IF;

  -- Insert mail
  INSERT INTO public.player_mail (sender_id, recipient_id, subject, body, attached_currency, attached_gold, attached_item_template_id, attached_item_qty)
  VALUES (caller_id, p_recipient_id, p_subject, p_body, p_attached_currency, p_attached_gold, p_attached_item_template_id, p_attached_item_qty)
  RETURNING id INTO new_mail_id;

  RETURN json_build_object('success', true, 'mail_id', new_mail_id);
EXCEPTION
  WHEN others THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Claim Mail Attachments
CREATE OR REPLACE FUNCTION public.rpc_claim_mail_attachments(
  p_mail_id INT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  mail_record RECORD;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  SELECT * INTO mail_record FROM public.player_mail WHERE id = p_mail_id AND recipient_id = caller_id;

  IF mail_record.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Mail not found or unauthorized.');
  END IF;

  IF mail_record.is_claimed THEN
    RETURN json_build_object('success', false, 'error', 'Attachments have already been claimed.');
  END IF;

  -- Update currencies
  UPDATE public.currencies
  SET balance_local = balance_local + mail_record.attached_currency,
      balance_gold = balance_gold + mail_record.attached_gold
  WHERE profile_id = caller_id;

  -- Update inventory
  IF mail_record.attached_item_template_id IS NOT NULL AND mail_record.attached_item_qty > 0 THEN
    INSERT INTO public.inventories (owner_id, item_template_id, quantity)
    VALUES (caller_id, mail_record.attached_item_template_id, mail_record.attached_item_qty)
    ON CONFLICT (owner_id, item_template_id)
    DO UPDATE SET quantity = public.inventories.quantity + EXCLUDED.quantity;
  END IF;

  -- Mark claimed and read
  UPDATE public.player_mail
  SET is_claimed = true, is_read = true
  WHERE id = p_mail_id;

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN others THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Create Contract
CREATE OR REPLACE FUNCTION public.rpc_create_contract(
  p_type VARCHAR(30),
  p_terms JSONB,
  p_escrow_local NUMERIC(20,2),
  p_escrow_gold NUMERIC(20,2),
  p_deadline TIMESTAMP WITH TIME ZONE
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  sender_local NUMERIC(20, 2);
  sender_gold NUMERIC(20, 2);
  new_contract_id INT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  -- Escrow validation
  SELECT balance_local, balance_gold INTO sender_local, sender_gold
  FROM public.currencies WHERE profile_id = caller_id;

  IF sender_local < p_escrow_local THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient local currency for escrow.');
  END IF;
  IF sender_gold < p_escrow_gold THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient gold for escrow.');
  END IF;

  -- Deduct escrow
  UPDATE public.currencies
  SET balance_local = balance_local - p_escrow_local,
      balance_gold = balance_gold - p_escrow_gold
  WHERE profile_id = caller_id;

  -- Insert contract
  INSERT INTO public.contracts (creator_id, type, terms_json, escrow_local, escrow_gold, deadline, status)
  VALUES (caller_id, p_type, p_terms, p_escrow_local, p_escrow_gold, p_deadline, 'offered')
  RETURNING id INTO new_contract_id;

  RETURN json_build_object('success', true, 'contract_id', new_contract_id);
EXCEPTION
  WHEN others THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Accept Contract
CREATE OR REPLACE FUNCTION public.rpc_accept_contract(
  p_contract_id INT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  contract_record RECORD;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  SELECT * INTO contract_record FROM public.contracts WHERE id = p_contract_id;

  IF contract_record.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Contract not found.');
  END IF;

  IF contract_record.status <> 'offered' THEN
    RETURN json_build_object('success', false, 'error', 'Contract is no longer offered.');
  END IF;

  IF contract_record.creator_id = caller_id THEN
    RETURN json_build_object('success', false, 'error', 'You cannot accept your own contract.');
  END IF;

  UPDATE public.contracts
  SET status = 'active'
  WHERE id = p_contract_id;

  -- Record execution
  INSERT INTO public.contract_executions (contract_id, actor_id, action_type, details)
  VALUES (p_contract_id, caller_id, 'accept', 'Contract accepted and is now active.');

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN others THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Complete Contract
CREATE OR REPLACE FUNCTION public.rpc_complete_contract(
  p_contract_id INT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  contract_record RECORD;
  acceptor_id UUID;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  SELECT * INTO contract_record FROM public.contracts WHERE id = p_contract_id;

  IF contract_record.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Contract not found.');
  END IF;

  IF contract_record.status <> 'active' THEN
    RETURN json_build_object('success', false, 'error', 'Contract is not currently active.');
  END IF;

  -- Only contract creator can mark it completed (approving the fulfillment)
  IF contract_record.creator_id <> caller_id THEN
    RETURN json_build_object('success', false, 'error', 'Only the contract creator can confirm completion.');
  END IF;

  -- Find acceptor
  SELECT actor_id INTO acceptor_id
  FROM public.contract_executions
  WHERE contract_id = p_contract_id AND action_type = 'accept'
  LIMIT 1;

  IF acceptor_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Acceptor not found for this contract.');
  END IF;

  -- Release escrow to acceptor
  UPDATE public.currencies
  SET balance_local = balance_local + contract_record.escrow_local,
      balance_gold = balance_gold + contract_record.escrow_gold
  WHERE profile_id = acceptor_id;

  UPDATE public.contracts
  SET status = 'completed'
  WHERE id = p_contract_id;

  -- Record execution
  INSERT INTO public.contract_executions (contract_id, actor_id, action_type, details)
  VALUES (p_contract_id, caller_id, 'complete', 'Contract marked completed, escrow released.');

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN others THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Publish Article
CREATE OR REPLACE FUNCTION public.rpc_publish_article(
  p_newspaper_id INT,
  p_title VARCHAR(200),
  p_content TEXT,
  p_category VARCHAR(30)
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  new_article_id INT;
  is_owner INT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  SELECT COUNT(*) INTO is_owner FROM public.newspapers
  WHERE id = p_newspaper_id AND owner_id = caller_id;

  IF is_owner = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Only the newspaper owner can publish articles.');
  END IF;

  INSERT INTO public.articles (newspaper_id, author_id, title, content, category)
  VALUES (p_newspaper_id, caller_id, p_title, p_content, p_category)
  RETURNING id INTO new_article_id;

  RETURN json_build_object('success', true, 'article_id', new_article_id);
EXCEPTION
  WHEN others THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Manage Friend Request
CREATE OR REPLACE FUNCTION public.rpc_respond_to_friend_request(
  p_friendship_id INT,
  p_accept BOOLEAN
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  friendship_record RECORD;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  SELECT * INTO friendship_record FROM public.friendships WHERE id = p_friendship_id;

  IF friendship_record.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Friend request not found.');
  END IF;

  -- Only target profile can accept/decline request (profile_id_2 is the recipient)
  IF friendship_record.profile_id_2 <> caller_id THEN
    RETURN json_build_object('success', false, 'error', 'Only the recipient of the friend request can respond.');
  END IF;

  IF p_accept THEN
    UPDATE public.friendships
    SET status = 'accepted'
    WHERE id = p_friendship_id;
  ELSE
    DELETE FROM public.friendships
    WHERE id = p_friendship_id;
  END IF;

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN others THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;
