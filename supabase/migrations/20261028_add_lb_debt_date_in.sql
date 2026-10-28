-- Living Budget: add Date In to debt records
ALTER TABLE public.lb_debts
ADD COLUMN IF NOT EXISTS date_in date;
