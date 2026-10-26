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
