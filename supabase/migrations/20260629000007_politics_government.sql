-- ==========================================
-- PHASE 9: NATIONS, POLITICS & GOVERNMENT
-- ==========================================

-- 1. Political Parties Table
CREATE TABLE IF NOT EXISTS public.political_parties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  country_id INT REFERENCES public.countries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- 2. Party Members Map
CREATE TABLE IF NOT EXISTS public.party_members (
  party_id INT REFERENCES public.political_parties(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  PRIMARY KEY (party_id, profile_id)
);

-- 3. Elections
CREATE TABLE IF NOT EXISTS public.elections (
  id SERIAL PRIMARY KEY,
  country_id INT REFERENCES public.countries(id) ON DELETE CASCADE,
  term_number INT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'campaign', -- campaign, voting, completed
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Seed an active election for Country 1 and Country 2
INSERT INTO public.elections (country_id, term_number, status, started_at, ends_at)
VALUES 
  (1, 1, 'campaign', now(), now() + INTERVAL '24 hours'),
  (2, 1, 'campaign', now(), now() + INTERVAL '24 hours')
ON CONFLICT DO NOTHING;

-- 4. Candidates
CREATE TABLE IF NOT EXISTS public.candidates (
  election_id INT REFERENCES public.elections(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  party_id INT REFERENCES public.political_parties(id) ON DELETE SET NULL,
  votes_received INT NOT NULL DEFAULT 0 CHECK (votes_received >= 0),
  PRIMARY KEY (election_id, candidate_id)
);

-- 5. Election Votes (Prevent duplicate votes)
CREATE TABLE IF NOT EXISTS public.election_votes (
  election_id INT REFERENCES public.elections(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (election_id, voter_id)
);

-- 6. Government Terms
CREATE TABLE IF NOT EXISTS public.government_terms (
  country_id INT REFERENCES public.countries(id) ON DELETE CASCADE,
  term_number INT NOT NULL,
  president_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY (country_id, term_number)
);

-- 7. Legislative Bills
CREATE TABLE IF NOT EXISTS public.bills (
  id SERIAL PRIMARY KEY,
  country_id INT REFERENCES public.countries(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- tax_change, budget_transfer, national_project
  parameters_json JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"vat_rate": 8.0}
  yes_votes INT NOT NULL DEFAULT 0 CHECK (yes_votes >= 0),
  no_votes INT NOT NULL DEFAULT 0 CHECK (no_votes >= 0),
  status VARCHAR(30) NOT NULL DEFAULT 'voting', -- voting, passed, rejected
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- 8. Government Votes (Prevent duplicate votes on bills)
CREATE TABLE IF NOT EXISTS public.government_votes (
  bill_id INT REFERENCES public.bills(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote VARCHAR(10) NOT NULL CHECK (vote IN ('yes', 'no')),
  PRIMARY KEY (bill_id, voter_id)
);

-- 9. National Projects
CREATE TABLE IF NOT EXISTS public.national_projects (
  id SERIAL PRIMARY KEY,
  country_id INT REFERENCES public.countries(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  cost_local NUMERIC(20, 2) NOT NULL CHECK (cost_local >= 0),
  progress_percent INT NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  bonuses_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.political_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.election_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.national_projects ENABLE ROW LEVEL SECURITY;

-- Read policies (Allow all authenticated users)
CREATE POLICY "Read political_parties" ON public.political_parties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read party_members" ON public.party_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read elections" ON public.elections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read candidates" ON public.candidates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read election_votes" ON public.election_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read government_terms" ON public.government_terms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read bills" ON public.bills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read government_votes" ON public.government_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read national_projects" ON public.national_projects FOR SELECT TO authenticated USING (true);

-- RPC Procedures: Party management
CREATE OR REPLACE FUNCTION public.rpc_create_political_party(
  p_name TEXT,
  p_description TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  caller_country_id INT;
  new_party_id INT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  SELECT citizenship_country_id INTO caller_country_id FROM public.profiles WHERE id = caller_id;
  IF caller_country_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'You must have citizenship to form a party.');
  END IF;

  INSERT INTO public.political_parties (name, description, leader_id, country_id)
  VALUES (p_name, p_description, caller_id, caller_country_id)
  RETURNING id INTO new_party_id;

  INSERT INTO public.party_members (party_id, profile_id)
  VALUES (new_party_id, caller_id);

  RETURN json_build_object('success', true, 'party_id', new_party_id, 'error', null);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.rpc_join_political_party(
  p_party_id INT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  caller_country_id INT;
  party_country_id INT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  SELECT citizenship_country_id INTO caller_country_id FROM public.profiles WHERE id = caller_id;
  SELECT country_id INTO party_country_id FROM public.political_parties WHERE id = p_party_id;

  IF caller_country_id <> party_country_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot join a foreign country political party.');
  END IF;

  -- Delete previous party memberships for simplicity
  DELETE FROM public.party_members WHERE profile_id = caller_id;

  INSERT INTO public.party_members (party_id, profile_id)
  VALUES (p_party_id, caller_id);

  RETURN json_build_object('success', true, 'error', null);
END;
$$ LANGUAGE plpgsql;

-- RPC Procedures: Election Candidates & Voting
CREATE OR REPLACE FUNCTION public.rpc_register_candidate(
  p_election_id INT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  caller_country_id INT;
  elect_country_id INT;
  elect_status VARCHAR(30);
  p_party_id INT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  SELECT citizenship_country_id INTO caller_country_id FROM public.profiles WHERE id = caller_id;
  SELECT country_id, status INTO elect_country_id, elect_status FROM public.elections WHERE id = p_election_id;

  IF elect_status <> 'campaign' THEN
    RETURN json_build_object('success', false, 'error', 'Candidate registration is closed for this period.');
  END IF;

  IF caller_country_id <> elect_country_id THEN
    RETURN json_build_object('success', false, 'error', 'You can only run in your citizenship country.');
  END IF;

  -- Detect political party mapping
  SELECT party_id INTO p_party_id FROM public.party_members WHERE profile_id = caller_id LIMIT 1;

  INSERT INTO public.candidates (election_id, candidate_id, party_id, votes_received)
  VALUES (p_election_id, caller_id, p_party_id, 0)
  ON CONFLICT DO NOTHING;

  RETURN json_build_object('success', true, 'error', null);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.rpc_vote_candidate(
  p_election_id INT,
  p_candidate_id UUID
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  caller_country_id INT;
  elect_country_id INT;
  already_voted BOOLEAN;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  SELECT citizenship_country_id INTO caller_country_id FROM public.profiles WHERE id = caller_id;
  SELECT country_id INTO elect_country_id FROM public.elections WHERE id = p_election_id;

  IF caller_country_id <> elect_country_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot vote in foreign elections.');
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.election_votes WHERE election_id = p_election_id AND voter_id = caller_id) INTO already_voted;
  IF already_voted THEN
    RETURN json_build_object('success', false, 'error', 'You have already voted in this election cycle.');
  END IF;

  -- Register Vote
  INSERT INTO public.election_votes (election_id, voter_id)
  VALUES (p_election_id, caller_id);

  UPDATE public.candidates 
  SET votes_received = votes_received + 1 
  WHERE election_id = p_election_id AND candidate_id = p_candidate_id;

  RETURN json_build_object('success', true, 'error', null);
END;
$$ LANGUAGE plpgsql;

-- RPC Procedures: Congress Bills proposing & voting
CREATE OR REPLACE FUNCTION public.rpc_propose_bill(
  p_title TEXT,
  p_description TEXT,
  p_type TEXT,
  p_parameters_json JSONB
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  caller_country_id INT;
  new_bill_id INT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  SELECT citizenship_country_id INTO caller_country_id FROM public.profiles WHERE id = caller_id;
  IF caller_country_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Must have citizenship to propose legislation.');
  END IF;

  IF p_type NOT IN ('tax_change', 'budget_transfer', 'national_project') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid bill type.');
  END IF;

  INSERT INTO public.bills (country_id, creator_id, title, description, type, parameters_json, yes_votes, no_votes, status, ends_at)
  VALUES (caller_country_id, caller_id, p_title, p_description, p_type, p_parameters_json, 0, 0, 'voting', now() + INTERVAL '24 hours')
  RETURNING id INTO new_bill_id;

  RETURN json_build_object('success', true, 'bill_id', new_bill_id, 'error', null);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.rpc_vote_bill(
  p_bill_id INT,
  p_vote TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  caller_country_id INT;
  bill_country_id INT;
  bill_status VARCHAR(30);
  already_voted BOOLEAN;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized.');
  END IF;

  IF p_vote NOT IN ('yes', 'no') THEN
    RETURN json_build_object('success', false, 'error', 'Vote must be yes or no.');
  END IF;

  SELECT citizenship_country_id INTO caller_country_id FROM public.profiles WHERE id = caller_id;
  SELECT country_id, status INTO bill_country_id, bill_status FROM public.bills WHERE id = p_bill_id;

  IF bill_status <> 'voting' THEN
    RETURN json_build_object('success', false, 'error', 'Voting has ended for this bill.');
  END IF;

  IF caller_country_id <> bill_country_id THEN
    RETURN json_build_object('success', false, 'error', 'You can only vote on legislation in your own country.');
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.government_votes WHERE bill_id = p_bill_id AND voter_id = caller_id) INTO already_voted;
  IF already_voted THEN
    RETURN json_build_object('success', false, 'error', 'You have already voted on this bill.');
  END IF;

  -- Cast vote
  INSERT INTO public.government_votes (bill_id, voter_id, vote)
  VALUES (p_bill_id, caller_id, p_vote);

  IF p_vote = 'yes' THEN
    UPDATE public.bills SET yes_votes = yes_votes + 1 WHERE id = p_bill_id;
  ELSE
    UPDATE public.bills SET no_votes = no_votes + 1 WHERE id = p_bill_id;
  END IF;

  RETURN json_build_object('success', true, 'error', null);
END;
$$ LANGUAGE plpgsql;

-- Stored Procedure: Tally bills and execute if approved
CREATE OR REPLACE FUNCTION public.rpc_tally_and_execute_bill(
  p_bill_id INT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bill_row RECORD;
  is_approved BOOLEAN;
BEGIN
  SELECT * INTO bill_row FROM public.bills WHERE id = p_bill_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Bill not found.');
  END IF;

  IF bill_row.status <> 'voting' THEN
    RETURN json_build_object('success', false, 'error', 'Bill has already been processed.');
  END IF;

  is_approved := (bill_row.yes_votes > bill_row.no_votes);

  IF is_approved THEN
    UPDATE public.bills SET status = 'passed' WHERE id = p_bill_id;

    -- Execute modifiers
    IF bill_row.type = 'tax_change' THEN
      UPDATE public.countries 
      SET vat_rate = COALESCE((bill_row.parameters_json->>'vat_rate')::numeric, vat_rate),
          income_tax_rate = COALESCE((bill_row.parameters_json->>'income_tax_rate')::numeric, income_tax_rate)
      WHERE id = bill_row.country_id;
    ELSIF bill_row.type = 'budget_transfer' THEN
      UPDATE public.countries
      SET local_currency_reserve = local_currency_reserve - (bill_row.parameters_json->>'amount')::numeric
      WHERE id = bill_row.country_id;
    ELSIF bill_row.type = 'national_project' THEN
      INSERT INTO public.national_projects (country_id, name, description, cost_local, progress_percent, bonuses_json)
      VALUES (
        bill_row.country_id,
        bill_row.title,
        bill_row.description,
        COALESCE((bill_row.parameters_json->>'cost_local')::numeric, 5000.00),
        0,
        COALESCE((bill_row.parameters_json->>'bonuses_json')::jsonb, '{}'::jsonb)
      );
    END IF;

    RETURN json_build_object('success', true, 'outcome', 'passed');
  ELSE
    UPDATE public.bills SET status = 'rejected' WHERE id = p_bill_id;
    RETURN json_build_object('success', true, 'outcome', 'rejected');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Stored Procedure: Tally active election and elect president
CREATE OR REPLACE FUNCTION public.rpc_execute_election_transition(
  p_election_id INT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  elect_row RECORD;
  winner RECORD;
BEGIN
  SELECT * INTO elect_row FROM public.elections WHERE id = p_election_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Election not found.');
  END IF;

  IF elect_row.status <> 'campaign' THEN
    RETURN json_build_object('success', false, 'error', 'Election has already transitioned.');
  END IF;

  -- Determine winner (candidate with maximum votes)
  SELECT * INTO winner 
  FROM public.candidates 
  WHERE election_id = p_election_id 
  ORDER BY votes_received DESC LIMIT 1;

  IF winner.candidate_id IS NULL THEN
    -- Nobody voted, default to none
    UPDATE public.elections SET status = 'completed' WHERE id = p_election_id;
    RETURN json_build_object('success', true, 'outcome', 'no_candidates');
  END IF;

  -- Close election
  UPDATE public.elections SET status = 'completed' WHERE id = p_election_id;

  -- Create new government terms
  INSERT INTO public.government_terms (country_id, term_number, president_id, started_at, ends_at)
  VALUES (
    elect_row.country_id,
    elect_row.term_number,
    winner.candidate_id,
    now(),
    now() + INTERVAL '24 hours'
  )
  ON CONFLICT (country_id, term_number) DO UPDATE
  SET president_id = EXCLUDED.president_id;

  RETURN json_build_object('success', true, 'winner_id', winner.candidate_id);
END;
$$ LANGUAGE plpgsql;

-- Override dynamic VAT rate calculations in marketplace purchases
CREATE OR REPLACE FUNCTION public.rpc_purchase_listing(
  p_listing_id UUID,
  p_purchase_quantity INT
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  caller_id UUID;
  listing_row RECORD;
  buyer_curr RECORD;
  seller_curr RECORD;
  total_cost NUMERIC(20,2);
  v_vat_rate NUMERIC;
  v_tax_amt NUMERIC;
  v_fee_rate NUMERIC := 0.0200; -- 2% marketplace fee
  v_fee_amt NUMERIC;
  v_payout NUMERIC;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Unauthenticated session.');
  END IF;

  -- Get listing details
  SELECT l.*, r.country_id
  INTO listing_row
  FROM public.market_listings l
  JOIN public.regions r ON r.id = l.region_id
  WHERE l.id = p_listing_id AND l.status = 'active';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Listing is no longer active.');
  END IF;

  IF listing_row.quantity < p_purchase_quantity THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient stock.');
  END IF;

  -- 1. Query Country tax modifier dynamically (VAT Rate)
  SELECT COALESCE(c.vat_rate / 100.00, 0.1000) INTO v_vat_rate 
  FROM public.countries c
  WHERE c.id = listing_row.country_id;

  total_cost := p_purchase_quantity * listing_row.price_per_unit;
  v_tax_amt := ROUND(total_cost * v_vat_rate, 2);
  v_fee_amt := ROUND(total_cost * v_fee_rate, 2);
  v_payout := total_cost - v_fee_amt - v_tax_amt;

  -- Lock currencies
  SELECT * INTO buyer_curr FROM public.currencies WHERE profile_id = caller_id FOR UPDATE;
  IF buyer_curr.local_currency_balance < (total_cost + v_tax_amt) THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient local currency.');
  END IF;

  -- Deduct buyer balance
  UPDATE public.currencies 
  SET local_currency_balance = local_currency_balance - (total_cost + v_tax_amt)
  WHERE profile_id = caller_id;

  -- Add seller balance
  IF listing_row.seller_id IS NOT NULL THEN
    UPDATE public.currencies 
    SET local_currency_balance = local_currency_balance + v_payout
    WHERE profile_id = listing_row.seller_id;
  ELSIF listing_row.seller_company_id IS NOT NULL THEN
    UPDATE public.npc_companies 
    SET vault_balance = vault_balance + v_payout
    WHERE id = listing_row.seller_company_id;
  END IF;

  -- Transfer VAT tax and marketplace fee directly to the Country Treasury reserves!
  UPDATE public.countries 
  SET local_currency_reserve = local_currency_reserve + v_tax_amt + v_fee_amt
  WHERE id = listing_row.country_id;

  -- Deduct Listing quantity
  IF listing_row.quantity = p_purchase_quantity THEN
    UPDATE public.market_listings SET quantity = 0, status = 'completed' WHERE id = p_listing_id;
  ELSE
    UPDATE public.market_listings SET quantity = quantity - p_purchase_quantity WHERE id = p_listing_id;
  END IF;

  -- Transfer item to buyer inventory
  IF listing_row.asset_type = 'resource' THEN
    INSERT INTO public.player_resources (profile_id, resource_id, quantity)
    VALUES (caller_id, listing_row.resource_id, p_purchase_quantity)
    ON CONFLICT (profile_id, resource_id) DO UPDATE 
    SET quantity = public.player_resources.quantity + p_purchase_quantity;
  ELSIF listing_row.asset_type = 'item' THEN
    UPDATE public.inventories 
    SET owner_id = caller_id 
    WHERE item_instance_id = listing_row.item_instance_id;
  END IF;

  -- Log transaction
  INSERT INTO public.market_transactions (listing_id, buyer_id, quantity, price_per_unit, tax_collected, marketplace_fee)
  VALUES (p_listing_id, caller_id, p_purchase_quantity, listing_row.price_per_unit, v_tax_amt, v_fee_amt);

  RETURN json_build_object(
    'success', true,
    'total_spent', (total_cost + v_tax_amt),
    'tax_collected', v_tax_amt,
    'fee_paid', v_fee_amt
  );
END;
$$;
