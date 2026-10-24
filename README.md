# Living Budget

**Plan Wisely. Spend Smartly. Build Your Future.**

A mobile-first personal budgeting app prototype built with plain HTML, CSS and JavaScript.

## Current preview
- Responsive premium-finance design
- Overview dashboard with income, expenses and balance
- Sample spending breakdown and monthly budget categories
- Add income and expense transactions
- Currency display preference
- Browser-local preview data

## Important
This is a front-end preview. It is not yet connected to Supabase, and sample transactions are not cloud-synced or user accounts. Data entered in this preview is saved only in the current browser using local storage.

## Planned next steps
1. Create separate `lb_*` Supabase tables.
2. Add Row Level Security policies so users can access only their own financial records.
3. Add sign-in and connect the app to Supabase.
4. Replace sample data with authenticated, database-backed data.

Never place a Supabase secret or `service_role` key in browser code. Only use a publishable key (or legacy anon key) in a browser app with properly configured Row Level Security.
