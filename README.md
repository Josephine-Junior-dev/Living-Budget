# Living Budget

**Plan Wisely. Spend Smartly. Build Your Future.**

A simple, mobile-first family budget app built with plain HTML, CSS and JavaScript.

## Features in this first build
- Simple dashboard for monthly income, expenses, balance and savings progress
- Add and search transactions, category filters, and CSV export
- Family budget categories and monthly spending progress
- Savings goals with contributions
- Bill due dates and paid/unpaid tracking
- Debts and loans tracker
- Monthly spending report and CSV download
- Family invitation preview and Premium feature page
- Currency preference and responsive Android-friendly navigation
- Supabase email sign-up/sign-in foundation and cloud transaction loading/saving when configured
- Separate `lb_*` database tables with Row Level Security policies

## Run locally / deploy
Serve this repository as a static website. The app can run in local preview mode without Supabase; preview records are stored in the current browser only.

## Enable Supabase
1. Open your Supabase project and go to **SQL Editor**.
2. Run the complete `supabase-schema.sql` script.
3. Open `config.js` and enter your project URL and publishable key (or legacy anon key).
4. Enable email authentication in Supabase Auth settings.
5. Reload the site and create an account.

Only use a Supabase publishable/anon key in `config.js`. Never expose a `service_role` or secret key in browser code.

## Important current limitations
This is the first working front-end build, not yet a production-ready paid service. Transaction cloud sync is wired to `lb_transactions`; budgets, goals, bills, debts and family invitations currently save in the browser on that device. Full cloud sync for every feature, verified family-member permissions, password/account flows, subscription billing, and production security review must be completed before selling it or storing real financial records. Premium checkout is not active.
