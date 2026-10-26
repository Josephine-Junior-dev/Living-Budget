-- LivingBudgetKenya: funding-source tracking for expenses.
-- Run this once in Supabase SQL Editor before using the updated app.
-- Adds optional fields only; existing transaction records are preserved.
alter table public.lb_transactions
  add column if not exists funding_source text,
  add column if not exists funding_amount numeric not null default 0;

alter table public.lb_transactions
  drop constraint if exists lb_transactions_funding_source_check;

alter table public.lb_transactions
  add constraint lb_transactions_funding_source_check
  check (
    funding_source is null
    or funding_source in ('borrowed','savings','cash','paid_by_someone','unpaid')
  );

-- Security: allow only signed-in users to access their own transactions.
-- Table-level grants apply to the newly added columns as well.
alter table public.lb_transactions enable row level security;

drop policy if exists "lb_transactions_own" on public.lb_transactions;
create policy "lb_transactions_own"
  on public.lb_transactions
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all privileges on table public.lb_transactions from anon, public;
grant select, insert, update, delete on table public.lb_transactions to authenticated;
