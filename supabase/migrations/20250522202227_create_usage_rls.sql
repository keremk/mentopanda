-- RLS Policies for usage table
-- BILLING/FINANCIAL DATA - Strict service-only control

-- SELECT: Users can view their own usage data for transparency
create policy "Users can view own usage data"
  on usage for select
  using (auth.uid() = user_id);

-- INSERT: Allow authenticated users to create their own usage records
-- This enables usage tracking from application routes
create policy "Users can create own usage data"
  on usage for insert
  with check (auth.uid() = user_id);

-- UPDATE: Allow authenticated users to update their own usage records
-- This enables usage tracking from application routes
create policy "Users can update own usage data"
  on usage for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE: Restrict deletion to prevent accidental data loss
-- Note: service_role bypasses RLS anyway, security definer functions have elevated privileges
create policy "Restrict usage deletion"
  on usage for delete
  using (false); -- No one can delete through normal user context
