-- ==========================================
-- PATCH 014: Fix marketplace FK constraints and add region_id
-- 1. Adds item_template_id FK constraints that were deferred from migration 003
--    because item_templates (migration 004) did not yet exist at that point.
-- 2. Adds region_id column to market_listings and market_orders
--    needed by the simulation engine (migration 005).
-- ==========================================

ALTER TABLE public.market_orders
  ADD CONSTRAINT fk_market_orders_item_template
  FOREIGN KEY (item_template_id) REFERENCES public.item_templates(id) ON DELETE SET NULL;

ALTER TABLE public.market_transactions
  ADD CONSTRAINT fk_market_transactions_item_template
  FOREIGN KEY (item_template_id) REFERENCES public.item_templates(id) ON DELETE SET NULL;

-- Add region_id to market_listings so the simulation can query by region
ALTER TABLE public.market_listings
  ADD COLUMN IF NOT EXISTS region_id INT REFERENCES public.regions(id) ON DELETE SET NULL;

ALTER TABLE public.market_orders
  ADD COLUMN IF NOT EXISTS region_id INT REFERENCES public.regions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_market_listings_region ON public.market_listings(region_id) WHERE status = 'active';

