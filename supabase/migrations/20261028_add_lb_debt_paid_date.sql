-- Living Budget: add optional date paid to debt records
-- Run this in Supabase SQL Editor for the existing project.
ALTER TABLE public.lb_debts
ADD COLUMN IF NOT EXISTS paid_date date;
