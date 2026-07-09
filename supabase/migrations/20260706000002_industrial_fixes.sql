-- Description: Align company creation and job application RPCs and add RLS write rules.

-- 1. [REMOVED] Create company parameter alignment overload wrapper (removed to prevent recursive stack overflow)


-- 2. Create job application RPC
CREATE OR REPLACE FUNCTION public.rpc_apply_to_job(
  target_job_id UUID
)
RETURNS JSON AS $$
DECLARE
  caller_id UUID;
  job_row RECORD;
  is_employed BOOLEAN;
BEGIN
  -- Authentication Check
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated.');
  END IF;

  -- Fetch Job Details
  SELECT * INTO job_row FROM public.company_jobs WHERE id = target_job_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Job posting not found.');
  END IF;

  IF NOT job_row.enabled OR job_row.vacancies <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'This job posting has no remaining vacancies.');
  END IF;

  -- Verify player is not already hired
  SELECT EXISTS(
    SELECT 1 FROM public.company_members 
    WHERE company_id = job_row.company_id AND profile_id = caller_id
  ) INTO is_employed;

  IF is_employed THEN
    RETURN json_build_object('success', false, 'error', 'You are already employed by this company.');
  END IF;

  -- Register Employee member
  INSERT INTO public.company_members (company_id, profile_id, role, salary, shifts_worked_today, max_daily_shifts, created_at)
  VALUES (job_row.company_id, caller_id, 'Employee', job_row.salary, 0, 5, NOW());

  -- Update job vacancy counter
  UPDATE public.company_jobs
  SET 
    vacancies = vacancies - 1,
    enabled = CASE WHEN vacancies - 1 > 0 THEN true ELSE false END
  WHERE id = target_job_id;

  -- Logging
  INSERT INTO public.company_logs (company_id, actor_id, action, metadata, created_at)
  VALUES (job_row.company_id, caller_id, 'employee.hired', json_build_object('salary', job_row.salary, 'job_id', target_job_id), NOW());

  INSERT INTO public.audit_logs (profile_id, action, metadata, created_at)
  VALUES (caller_id, 'company.join', json_build_object('company_id', job_row.company_id, 'role', 'Employee'), NOW());

  RETURN json_build_object('success', true, 'error', null);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RLS Write policies for company jobs
CREATE POLICY insert_comp_jobs ON public.company_jobs 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies 
      WHERE id = company_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY update_comp_jobs ON public.company_jobs 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.companies 
      WHERE id = company_id AND owner_id = auth.uid()
    )
  );

-- RLS Write policies for company logs
CREATE POLICY insert_comp_logs ON public.company_logs 
  FOR INSERT 
  WITH CHECK (
    actor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.company_members 
      WHERE company_id = company_logs.company_id AND profile_id = auth.uid()
    )
  );
