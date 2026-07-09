-- ==========================================
-- PHASE 5: GLOBAL MARKETPLACE SCHEMA & ENGINE
-- ==========================================

-- 1. Fee Configurations Table
CREATE TABLE IF NOT EXISTS market_fees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  rate NUMERIC(5, 4) NOT NULL, -- e.g. 0.0200 for 2%
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Seed dynamic fees
INSERT INTO market_fees (name, rate, description)
VALUES 
  ('marketplace_fee', 0.0200, 'Fee collected from sellers for executing a trade (2%)'),
  ('vat_rate', 0.0500, 'Value Added Tax collected on transactions (5%)')
ON CONFLICT (name) DO UPDATE SET rate = EXCLUDED.rate;

-- 2. Sell Listings Table
CREATE TABLE IF NOT EXISTS market_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seller_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('resource', 'item')),
  resource_id INT REFERENCES resources(id),
  item_id UUID REFERENCES inventories(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0),
  price_per_unit NUMERIC(15, 2) NOT NULL CHECK (price_per_unit > 0.00),
  currency_type VARCHAR(10) DEFAULT 'local' CHECK (currency_type IN ('local', 'gold')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Buy Orders Table
CREATE TABLE IF NOT EXISTS market_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  buyer_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('resource', 'item')),
  resource_id INT REFERENCES resources(id),
  item_template_id INT, -- FK to item_templates added in migration 014 after item_templates table is created
  quantity INT NOT NULL CHECK (quantity > 0),
  price_per_unit NUMERIC(15, 2) NOT NULL CHECK (price_per_unit > 0.00),
  currency_type VARCHAR(10) DEFAULT 'local' CHECK (currency_type IN ('local', 'gold')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Transactions Log Table
CREATE TABLE IF NOT EXISTS market_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  seller_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  buyer_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('resource', 'item')),
  resource_id INT REFERENCES resources(id),
  item_template_id INT, -- FK to item_templates added in migration 014 after item_templates table is created
  quantity INT NOT NULL CHECK (quantity > 0),
  price_per_unit NUMERIC(15, 2) NOT NULL CHECK (price_per_unit > 0.00),
  currency_type VARCHAR(10) DEFAULT 'local' CHECK (currency_type IN ('local', 'gold')),
  tax_collected NUMERIC(15, 2) DEFAULT 0.00,
  marketplace_fee NUMERIC(15, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Escrow Vault Table
CREATE TABLE IF NOT EXISTS market_escrow (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES market_listings(id) ON DELETE CASCADE,
  order_id UUID REFERENCES market_orders(id) ON DELETE CASCADE,
  escrow_type VARCHAR(20) NOT NULL CHECK (escrow_type IN ('resource', 'item', 'currency')),
  resource_id INT REFERENCES resources(id),
  item_id UUID REFERENCES inventories(id),
  currency_type VARCHAR(10) CHECK (currency_type IN ('local', 'gold')),
  amount NUMERIC(15, 4) NOT NULL CHECK (amount >= 0.0000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Watchlist Table
CREATE TABLE IF NOT EXISTS market_watchlists (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('resource', 'item')),
  asset_id INT NOT NULL, -- resources(id) or item_templates(id)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (profile_id, asset_type, asset_id)
);

-- 7. Price Alerts Table
CREATE TABLE IF NOT EXISTS market_price_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('resource', 'item')),
  asset_id INT NOT NULL,
  target_price NUMERIC(15, 2) NOT NULL CHECK (target_price > 0.00),
  alert_condition VARCHAR(10) NOT NULL CHECK (alert_condition IN ('above', 'below')),
  is_triggered BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Persistent Notifications Table
CREATE TABLE IF NOT EXISTS market_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'sale', 'purchase', 'cancellation', 'alert'
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- INDEXES & PERFORMANCE TUNING
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_market_listings_match ON market_listings(asset_type, resource_id, item_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_market_orders_match ON market_orders(asset_type, resource_id, item_template_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_market_listings_sort ON market_listings(price_per_unit ASC, created_at ASC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_market_orders_sort ON market_orders(price_per_unit DESC, created_at ASC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_market_transactions_history ON market_transactions(resource_id, item_template_id, created_at DESC);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE market_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_escrow ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_notifications ENABLE ROW LEVEL SECURITY;

-- Dynamic Fee policies: public read, admin update
CREATE POLICY "Public Read market_fees" ON market_fees FOR SELECT USING (true);

-- Listings policies: public read, seller update/delete
CREATE POLICY "Public Read Listings" ON market_listings FOR SELECT USING (true);
CREATE POLICY "Seller Manage Listings" ON market_listings FOR ALL USING (auth.uid() = seller_id);

-- Orders policies: public read, buyer manage
CREATE POLICY "Public Read Orders" ON market_orders FOR SELECT USING (true);
CREATE POLICY "Buyer Manage Orders" ON market_orders FOR ALL USING (auth.uid() = buyer_id);

-- Transactions: public read, insert via system RPCs only
CREATE POLICY "Public Read Transactions" ON market_transactions FOR SELECT USING (true);

-- Escrow: only owner profile or owner company staff can view
CREATE POLICY "Owner View Escrow" ON market_escrow FOR SELECT USING (
  auth.uid() = profile_id OR 
  EXISTS (
    SELECT 1 FROM company_members 
    WHERE company_id = market_escrow.company_id AND profile_id = auth.uid()
  )
);

-- Watchlist: self-managed
CREATE POLICY "User Manage Watchlist" ON market_watchlists FOR ALL USING (auth.uid() = profile_id);

-- Alerts: self-managed
CREATE POLICY "User Manage Alerts" ON market_price_alerts FOR ALL USING (auth.uid() = profile_id);

-- Notifications: self-managed
CREATE POLICY "User Manage Notifications" ON market_notifications FOR ALL USING (auth.uid() = profile_id);

-- ==========================================
-- ENGINE TRANSACTION PL/PGSQL PROCEDURES
-- ==========================================

-- A. Match Order Routine
CREATE OR REPLACE FUNCTION rpc_match_orders(
  p_asset_type VARCHAR,
  p_resource_id INT,
  p_item_template_id INT
) RETURNS VOID AS $$
DECLARE
  v_bid RECORD;
  v_ask RECORD;
  v_trade_qty INT;
  v_trade_price NUMERIC;
  v_fee_rate NUMERIC;
  v_vat_rate NUMERIC;
  v_total_cost NUMERIC;
  v_tax_amt NUMERIC;
  v_fee_amt NUMERIC;
  v_payout NUMERIC;
  v_escrow_cash_refund NUMERIC;
  v_buyer_company_id UUID;
  v_seller_company_id UUID;
BEGIN
  -- Get active system fee modifiers
  SELECT rate INTO v_fee_rate FROM market_fees WHERE name = 'marketplace_fee';
  SELECT rate INTO v_vat_rate FROM market_fees WHERE name = 'vat_rate';
  IF v_fee_rate IS NULL THEN v_fee_rate := 0.0200; END IF;
  IF v_vat_rate IS NULL THEN v_vat_rate := 0.0500; END IF;

  -- matching loop: fetch top priority buy order overlapping lowest sell order
  LOOP
    -- Fetch highest bidding active buy order (FIFO)
    SELECT * INTO v_bid 
    FROM market_orders
    WHERE status = 'active'
      AND asset_type = p_asset_type
      AND (p_resource_id IS NULL OR resource_id = p_resource_id)
      AND (p_item_template_id IS NULL OR item_template_id = p_item_template_id)
    ORDER BY price_per_unit DESC, created_at ASC
    LIMIT 1;

    -- Fetch lowest asking active sell listing (FIFO)
    SELECT * INTO v_ask 
    FROM market_listings
    WHERE status = 'active'
      AND asset_type = p_asset_type
      AND (p_resource_id IS NULL OR resource_id = p_resource_id)
      AND (p_item_template_id IS NULL OR (
        EXISTS (
          SELECT 1 FROM inventories 
          WHERE id = market_listings.item_id AND item_template_id = p_item_template_id
        )
      ))
      -- Ensure price overlap
      AND price_per_unit <= v_bid.price_per_unit
    ORDER BY price_per_unit ASC, created_at ASC
    LIMIT 1;

    -- Stop if no matching pairs exist
    IF v_bid.id IS NULL OR v_ask.id IS NULL THEN
      EXIT;
    END IF;

    -- Set transaction properties
    v_trade_qty := LEAST(v_bid.quantity, v_ask.quantity);
    v_trade_price := v_ask.price_per_unit; -- Trade clears at the existing seller's posted ask rate

    v_total_cost := v_trade_qty * v_trade_price;
    v_tax_amt := ROUND(v_total_cost * v_vat_rate, 2);
    v_fee_amt := ROUND(v_total_cost * v_fee_rate, 2);
    v_payout := v_total_cost - v_fee_amt - v_tax_amt;

    -- 1. Deduct quantity or complete Sell Listing
    UPDATE market_listings
    SET quantity = quantity - v_trade_qty,
        status = CASE WHEN quantity - v_trade_qty = 0 THEN 'completed' ELSE 'active' END,
        updated_at = NOW()
    WHERE id = v_ask.id;

    -- Deduct escrowed listed item quantity
    IF p_asset_type = 'resource' THEN
      UPDATE market_escrow
      SET amount = amount - v_trade_qty
      WHERE listing_id = v_ask.id AND escrow_type = 'resource';
    ELSIF p_asset_type = 'item' THEN
      -- Specific item transfers: buyer claims ownership
      UPDATE inventories
      SET owner_id = v_bid.buyer_id,
          updated_at = NOW()
      WHERE id = v_ask.item_id;
    END IF;

    -- Delete completed listing escrow rows
    DELETE FROM market_escrow WHERE listing_id = v_ask.id AND amount <= 0;

    -- 2. Deduct quantity or complete Buy Order
    UPDATE market_orders
    SET quantity = quantity - v_trade_qty,
        status = CASE WHEN quantity - v_trade_qty = 0 THEN 'completed' ELSE 'active' END,
        updated_at = NOW()
    WHERE id = v_bid.id;

    -- Deduct buyer's escrow cash
    -- Note: buyer escrow locked v_bid.quantity * v_bid.price_per_unit.
    -- Since we clear at v_trade_price, the buyer gets refunded the difference: (v_bid.price_per_unit - v_trade_price) * v_trade_qty
    v_escrow_cash_refund := (v_bid.price_per_unit - v_trade_price) * v_trade_qty;
    
    UPDATE market_escrow
    SET amount = amount - (v_bid.price_per_unit * v_trade_qty)
    WHERE order_id = v_bid.id AND escrow_type = 'currency';

    -- Issue refund to buyer's wallet/vault
    IF v_escrow_cash_refund > 0 THEN
      IF v_bid.buyer_company_id IS NULL THEN
        UPDATE currencies 
        SET local_currency_balance = local_currency_balance + v_escrow_cash_refund, updated_at = NOW()
        WHERE profile_id = v_bid.buyer_id;
      ELSE
        UPDATE company_vaults
        SET local_currency = local_currency + v_escrow_cash_refund, updated_at = NOW()
        WHERE company_id = v_bid.buyer_company_id;
      END IF;
    END IF;

    DELETE FROM market_escrow WHERE order_id = v_bid.id AND amount <= 0;

    -- 3. Deliver resources to Buyer
    IF p_asset_type = 'resource' THEN
      IF v_bid.buyer_company_id IS NULL THEN
        -- Add to player bag
        INSERT INTO player_resources (profile_id, resource_id, quantity)
        VALUES (v_bid.buyer_id, p_resource_id, v_trade_qty)
        ON CONFLICT (profile_id, resource_id) 
        DO UPDATE SET quantity = player_resources.quantity + v_trade_qty;
      ELSE
        -- Add to company vault
        INSERT INTO company_inventory (company_id, resource_id, quantity)
        VALUES (v_bid.buyer_company_id, p_resource_id, v_trade_qty)
        ON CONFLICT (company_id, resource_id)
        DO UPDATE SET quantity = company_inventory.quantity + v_trade_qty;
      END IF;
    END IF;

    -- 4. Pay funds to Seller
    IF v_ask.seller_company_id IS NULL THEN
      UPDATE currencies
      SET local_currency_balance = local_currency_balance + v_payout,
          updated_at = NOW()
      WHERE profile_id = v_ask.seller_id;
    ELSE
      UPDATE company_vaults
      SET local_currency = local_currency + v_payout,
          updated_at = NOW()
      WHERE company_id = v_ask.seller_company_id;
    END IF;

    -- 5. Record Transaction Log
    INSERT INTO market_transactions (
      seller_id, seller_company_id, buyer_id, buyer_company_id,
      asset_type, resource_id, item_template_id, quantity, price_per_unit, currency_type,
      tax_collected, marketplace_fee
    )
    VALUES (
      v_ask.seller_id, v_ask.seller_company_id, v_bid.buyer_id, v_bid.buyer_company_id,
      p_asset_type, p_resource_id, p_item_template_id, v_trade_qty, v_trade_price, v_ask.currency_type,
      v_tax_amt, v_fee_amt
    );

    -- 6. Emit Real-Time Notifications
    INSERT INTO market_notifications (profile_id, type, message)
    VALUES 
      (v_ask.seller_id, 'sale', 'Your listing was purchased! Sold ' || v_trade_qty || ' units at ' || v_trade_price || ' LC.'),
      (v_bid.buyer_id, 'purchase', 'Your order was fulfilled! Bought ' || v_trade_qty || ' units at ' || v_trade_price || ' LC.');

    -- Trigger Price Alerts
    INSERT INTO market_notifications (profile_id, type, message)
    SELECT profile_id, 'alert', 'Price Alert triggered! ' || p_asset_type || ' reached target price of ' || v_trade_price || ' LC.'
    FROM market_price_alerts
    WHERE asset_type = p_asset_type
      AND asset_id = COALESCE(p_resource_id, p_item_template_id)
      AND is_triggered = false
      AND (
        (alert_condition = 'below' AND target_price >= v_trade_price) OR
        (alert_condition = 'above' AND target_price <= v_trade_price)
      );

    -- Mark alerts as triggered
    UPDATE market_price_alerts
    SET is_triggered = true
    WHERE asset_type = p_asset_type
      AND asset_id = COALESCE(p_resource_id, p_item_template_id)
      AND is_triggered = false
      AND (
        (alert_condition = 'below' AND target_price >= v_trade_price) OR
        (alert_condition = 'above' AND target_price <= v_trade_price)
      );

  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- B. Create Sell Listing RPC
CREATE OR REPLACE FUNCTION rpc_create_sell_listing(
  p_company_id UUID,
  p_asset_type VARCHAR,
  p_resource_id INT,
  p_item_id UUID,
  p_quantity INT,
  p_price_per_unit NUMERIC,
  p_currency_type VARCHAR
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_listing_id UUID;
  v_stock INT := 0;
  v_item_template_id INT;
BEGIN
  -- Validation
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.';
  END IF;

  IF p_quantity <= 0 OR p_price_per_unit <= 0.00 THEN
    RAISE EXCEPTION 'Quantity and price must be positive.';
  END IF;

  -- Escrow checks & balances
  IF p_company_id IS NULL THEN
    -- Player Listing: verify user has sufficient resources/items
    IF p_asset_type = 'resource' THEN
      SELECT quantity INTO v_stock FROM player_resources WHERE profile_id = v_user_id AND resource_id = p_resource_id;
      IF v_stock IS NULL OR v_stock < p_quantity THEN
        RAISE EXCEPTION 'Insufficient resources in inventory.';
      END IF;
      -- Deduct from user bag
      UPDATE player_resources SET quantity = quantity - p_quantity WHERE profile_id = v_user_id AND resource_id = p_resource_id;
    ELSE
      -- Specific Item: verify ownership
      SELECT item_template_id INTO v_item_template_id FROM inventories WHERE id = p_item_id AND owner_id = v_user_id;
      IF v_item_template_id IS NULL THEN
        RAISE EXCEPTION 'Item not found in inventory.';
      END IF;
      -- Lock ownership by assigning to system/marketplace escrow (set owner_id to NULL to lock it)
      UPDATE inventories SET owner_id = NULL WHERE id = p_item_id;
    END IF;
  ELSE
    -- Company Listing: verify member authorization
    IF NOT EXISTS (
      SELECT 1 FROM company_members 
      WHERE company_id = p_company_id AND profile_id = v_user_id AND role IN ('Owner', 'Director', 'Manager')
    ) THEN
      RAISE EXCEPTION 'Insufficient company permission.';
    END IF;

    IF p_asset_type = 'resource' THEN
      SELECT quantity INTO v_stock FROM company_inventory WHERE company_id = p_company_id AND resource_id = p_resource_id;
      IF v_stock IS NULL OR v_stock < p_quantity THEN
        RAISE EXCEPTION 'Insufficient resources in company vault.';
      END IF;
      -- Deduct from company vault
      UPDATE company_inventory SET quantity = quantity - p_quantity WHERE company_id = p_company_id AND resource_id = p_resource_id;
    ELSE
      RAISE EXCEPTION 'Companies cannot list individual items yet.';
    END IF;
  END IF;

  -- Create listing
  INSERT INTO market_listings (
    seller_id, seller_company_id, asset_type, resource_id, item_id, quantity, price_per_unit, currency_type, status
  )
  VALUES (
    v_user_id, p_company_id, p_asset_type, p_resource_id, p_item_id, p_quantity, p_price_per_unit, p_currency_type, 'active'
  )
  RETURNING id INTO v_listing_id;

  -- Populate Escrow
  INSERT INTO market_escrow (
    profile_id, company_id, listing_id, escrow_type, resource_id, item_id, amount
  )
  VALUES (
    CASE WHEN p_company_id IS NULL THEN v_user_id ELSE NULL END,
    p_company_id,
    v_listing_id,
    CASE WHEN p_asset_type = 'resource' THEN 'resource'::varchar ELSE 'item'::varchar END,
    p_resource_id,
    p_item_id,
    p_quantity
  );

  -- Perform matching engine tick
  PERFORM rpc_match_orders(p_asset_type, p_resource_id, v_item_template_id);

  RETURN v_listing_id;
END;
$$ LANGUAGE plpgsql;

-- C. Create Buy Order RPC
CREATE OR REPLACE FUNCTION rpc_create_buy_order(
  p_company_id UUID,
  p_asset_type VARCHAR,
  p_resource_id INT,
  p_item_template_id INT,
  p_quantity INT,
  p_price_per_unit NUMERIC,
  p_currency_type VARCHAR
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_order_id UUID;
  v_cash_required NUMERIC;
  v_wallet_bal NUMERIC := 0.00;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.';
  END IF;

  IF p_quantity <= 0 OR p_price_per_unit <= 0.00 THEN
    RAISE EXCEPTION 'Quantity and price must be positive.';
  END IF;

  v_cash_required := p_quantity * p_price_per_unit;

  -- Check buyer balance & Lock inside escrow
  IF p_company_id IS NULL THEN
    SELECT local_currency_balance INTO v_wallet_bal FROM currencies WHERE profile_id = v_user_id;
    IF v_wallet_bal IS NULL OR v_wallet_bal < v_cash_required THEN
      RAISE EXCEPTION 'Insufficient cash in wallet.';
    END IF;
    -- Deduct from wallet
    UPDATE currencies SET local_currency_balance = local_currency_balance - v_cash_required WHERE profile_id = v_user_id;
  ELSE
    -- Verify role authority
    IF NOT EXISTS (
      SELECT 1 FROM company_members 
      WHERE company_id = p_company_id AND profile_id = v_user_id AND role IN ('Owner', 'Director', 'Manager', 'Accountant')
    ) THEN
      RAISE EXCEPTION 'Insufficient company permission.';
    END IF;

    SELECT local_currency INTO v_wallet_bal FROM company_vaults WHERE company_id = p_company_id;
    IF v_wallet_bal IS NULL OR v_wallet_bal < v_cash_required THEN
      RAISE EXCEPTION 'Insufficient cash in company vault.';
    END IF;
    -- Deduct from vault cash
    UPDATE company_vaults SET local_currency = local_currency - v_cash_required WHERE company_id = p_company_id;
  END IF;

  -- Create order
  INSERT INTO market_orders (
    buyer_id, buyer_company_id, asset_type, resource_id, item_template_id, quantity, price_per_unit, currency_type, status
  )
  VALUES (
    v_user_id, p_company_id, p_asset_type, p_resource_id, p_item_template_id, p_quantity, p_price_per_unit, p_currency_type, 'active'
  )
  RETURNING id INTO v_order_id;

  -- Lock cash in escrow
  INSERT INTO market_escrow (
    profile_id, company_id, order_id, escrow_type, currency_type, amount
  )
  VALUES (
    CASE WHEN p_company_id IS NULL THEN v_user_id ELSE NULL END,
    p_company_id,
    v_order_id,
    'currency',
    p_currency_type,
    v_cash_required
  );

  -- Perform matching engine tick
  PERFORM rpc_match_orders(p_asset_type, p_resource_id, p_item_template_id);

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- D. Cancel Sell Listing
CREATE OR REPLACE FUNCTION rpc_cancel_listing(
  p_listing_id UUID
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_listing RECORD;
  v_escrow RECORD;
BEGIN
  SELECT * INTO v_listing FROM market_listings WHERE id = p_listing_id;
  IF v_listing.id IS NULL THEN
    RAISE EXCEPTION 'Listing not found.';
  END IF;

  IF v_listing.seller_id != v_user_id THEN
    RAISE EXCEPTION 'Unauthorized cancellation request.';
  END IF;

  IF v_listing.status != 'active' THEN
    RAISE EXCEPTION 'Listing is no longer active.';
  END IF;

  -- Retrieve escrow content
  SELECT * INTO v_escrow FROM market_escrow WHERE listing_id = p_listing_id;

  -- Flag listing as cancelled
  UPDATE market_listings SET status = 'cancelled', updated_at = NOW() WHERE id = p_listing_id;

  -- Return assets from escrow
  IF v_listing.asset_type = 'resource' THEN
    IF v_listing.seller_company_id IS NULL THEN
      INSERT INTO player_resources (profile_id, resource_id, quantity)
      VALUES (v_user_id, v_listing.resource_id, v_escrow.amount)
      ON CONFLICT (profile_id, resource_id) 
      DO UPDATE SET quantity = player_resources.quantity + v_escrow.amount;
    ELSE
      INSERT INTO company_inventory (company_id, resource_id, quantity)
      VALUES (v_listing.seller_company_id, v_listing.resource_id, v_escrow.amount)
      ON CONFLICT (company_id, resource_id)
      DO UPDATE SET quantity = company_inventory.quantity + v_escrow.amount;
    END IF;
  ELSE
    -- Item: unlock escrow lock by restoring owner
    UPDATE inventories SET owner_id = v_user_id WHERE id = v_listing.item_id;
  END IF;

  DELETE FROM market_escrow WHERE listing_id = p_listing_id;

  INSERT INTO market_notifications(profile_id, type, message)
  VALUES (v_user_id, 'cancellation', 'Cancelled listing for ' || v_listing.asset_type || '. Assets returned to stock.');
END;
$$ LANGUAGE plpgsql;

-- E. Cancel Buy Order
CREATE OR REPLACE FUNCTION rpc_cancel_order(
  p_order_id UUID
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_order RECORD;
  v_escrow RECORD;
BEGIN
  SELECT * INTO v_order FROM market_orders WHERE id = p_order_id;
  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  IF v_order.buyer_id != v_user_id THEN
    RAISE EXCEPTION 'Unauthorized cancellation request.';
  END IF;

  IF v_order.status != 'active' THEN
    RAISE EXCEPTION 'Order is no longer active.';
  END IF;

  -- Retrieve escrow content
  SELECT * INTO v_escrow FROM market_escrow WHERE order_id = p_order_id;

  -- Flag order as cancelled
  UPDATE market_orders SET status = 'cancelled', updated_at = NOW() WHERE id = p_order_id;

  -- Return cash from escrow
  IF v_order.buyer_company_id IS NULL THEN
    UPDATE currencies
    SET local_currency_balance = local_currency_balance + v_escrow.amount,
        updated_at = NOW()
    WHERE profile_id = v_user_id;
  ELSE
    UPDATE company_vaults
    SET local_currency = local_currency + v_escrow.amount,
        updated_at = NOW()
    WHERE company_id = v_order.buyer_company_id;
  END IF;

  DELETE FROM market_escrow WHERE order_id = p_order_id;

  INSERT INTO market_notifications(profile_id, type, message)
  VALUES (v_user_id, 'cancellation', 'Cancelled active buy order. Locked currency was refunded.');
END;
$$ LANGUAGE plpgsql;
