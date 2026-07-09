-- Align work_at_company RPC with rpc_work_shift_company for backward compatibility
CREATE OR REPLACE FUNCTION public.work_at_company(company_id UUID)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  result JSON;
BEGIN
  -- Delegate to the main shift RPC implementation
  result := rpc_work_shift_company(company_id);
  RETURN result;
END;
$$;
