# DECISIONS.md - Engineering Decision Log

This document records the significant engineering decisions made during development. Each entry explains the problem, the options considered, the final decision, the reasoning, and the tradeoffs.

---

## D01 - Backend framework: Flask over FastAPI/Django

**Problem**: Choose a Python web framework for the API.

**Options**:
1. **Flask 3** - lightweight, mature, simple blueprints, huge ecosystem
2. **FastAPI** - modern, async-first, built-in OpenAPI docs, type hints with Pydantic
3. **Django + DRF** - batteries-included, opinionated

**Decision**: Flask 3

**Reasoning**:
- The codebase already had Flask scaffolding and a sync SQLAlchemy setup (via Flask-SQLAlchemy). Switching to FastAPI would have required rewriting all services to async, which conflicts with Flask-SQLAlchemy's sync session API.
- The app's I/O is not heavy enough to need async. Most operations are CRUD with short DB queries.
- Flask's blueprint system keeps the API surface modular (auth, groups, expenses, settlements, balances, imports, users).

**Tradeoffs**:
- No built-in OpenAPI / Swagger docs (we provide a separate Markdown API reference instead).
- We had to add Pydantic manually for request validation (FastAPI has it built-in).
- We had to add flask-cors manually (FastAPI has it in middleware).

---

## D02 - Authentication: Clerk over self-hosted JWT

**Problem**: How to handle user sign-up, sign-in, and session management.

**Options**:
1. **Clerk** - managed service with email + social + MFA + JWT issuance
2. **Self-hosted auth** - Flask-JWT-Extended with our own user table
3. **Auth0 / Firebase Auth** - alternatives to Clerk

**Decision**: Clerk in production, with a dev-mode email-only fallback.

**Reasoning**:
- Clerk handles email verification, password reset, social login, MFA, profile management out of the box. Re-implementing these in two days is infeasible.
- Clerk's JWKS-based JWT validation integrates cleanly with Flask-JWT-Extended.
- For local development without Clerk credentials, we added a `CLERK_ENABLED=false` mode that issues our own JWTs based on email lookup, so contributors can run the app without setting up Clerk.

**Tradeoffs**:
- Vendor dependency - if Clerk has an outage, we have a degraded experience.
- Free tier is limited (10k MAU); scaling beyond requires payment.
- The dev/prod auth paths are slightly different, which can cause subtle bugs.

---

## D03 - Database: PostgreSQL (Neon) with SQLite for dev

**Problem**: Pick a database for production.

**Options**:
1. **PostgreSQL** (via Neon free tier) - real relational DB, supports JSONB
2. **SQLite** - zero-config, file-based, fast for dev
3. **MongoDB** - flexible schema, but we have strong relational needs

**Decision**: PostgreSQL for production, SQLite for local development.

**Reasoning**:
- The data model is highly relational (users → groups → members → expenses → participants). SQLAlchemy handles the relations naturally with PostgreSQL.
- PostgreSQL's JSONB column is perfect for the `import_anomalies.suggested_action` and `import_anomalies.raw_row_data` fields - flexible but indexed.
- Neon offers a generous free tier (0.5 GB, 190 compute hours/month) that's enough for a demo.
- SQLite gives a zero-friction local setup; the same SQLAlchemy models work against both.

**Tradeoffs**:
- Some features differ between SQLite and PostgreSQL (e.g., JSONB queries, `gen_random_uuid()`).
- Tests against SQLite may pass but break on PostgreSQL (or vice versa). We catch these in CI but not for local dev.

---

## D04 - ORM: SQLAlchemy 2.0 sync (not async)

**Problem**: Sync vs async ORM.

**Options**:
1. **SQLAlchemy 2.0 sync** (Flask-SQLAlchemy)
2. **SQLAlchemy 2.0 async**
3. **SQLModel** (FastAPI-native)

**Decision**: SQLAlchemy 2.0 sync via Flask-SQLAlchemy.

**Reasoning**:
- The drivers we use (psycopg2 for PostgreSQL, sqlite3 for SQLite) are sync.
- Mixing async SQLAlchemy with sync Flask views requires careful session management in each view.
- Sync code is simpler to read and reason about for a CRUD-heavy app.

**Tradeoffs**:
- We can't reuse SQLAlchemy `AsyncSession` in the same process. Some services import `AsyncSession` for type hints but actually use `db.session` (sync). This was a source of a bug earlier (a dev tried `self.session.execute(...)` with `AsyncSession` semantics). We later cleaned this up.
- Performance: under heavy concurrent load, sync code blocks worker threads. For our expected load (small groups), this is fine.

---

## D05 - Anomaly handling policy: surface, never silently fix

**Problem**: When CSV data has issues, how aggressive should the importer be?

**Options**:
1. **Silent fixes** - auto-correct everything (e.g., normalize dates, fill missing payer)
2. **Hard fail** - reject the entire import on any error
3. **Surface to user, default to safe behaviour** - show every issue, let user approve/reject

**Decision**: Option 3 - surface every anomaly, default to safe behaviour, allow bulk-approve.

**Reasoning**:
- The assignment explicitly states: "A crashed import and a silent guess are both failing answers."
- Silent fixes can introduce subtle bugs (e.g., misinterpreting dates).
- A hard fail is too aggressive - most CSVs have at least one minor issue, and forcing the user to clean the CSV by hand defeats the point of the import feature.
- Surface + bulk-approve gives the user transparency and control: they see what was wrong, can accept the defaults, or override per-row.

**Tradeoffs**:
- The review UI is more complex (filter tabs, approve/reject buttons, bulk actions).
- Some users will blindly click "Approve All" without reading.

---

## D06 - Settlement detection: heuristic with safe default

**Problem**: Rows like "Rohan paid Aisha back" look like settlements but are sometimes expenses.

**Options**:
1. **Auto-convert** detected settlements to settlement records
2. **Flag as anomaly** and let user decide
3. **Reject** them entirely

**Decision**: Option 2 - flag as warning, default to "keep as expense" on bulk-approve.

**Reasoning**:
- Auto-converting has too many false positives ("Sam deposit share" is a deposit, not a settlement, even though "deposit share" matches).
- Rejecting loses data.
- Flagging gives the user the option to convert manually after import (a future feature).

**Tradeoffs**:
- Users see a warning they may not understand.

---

## D07 - Membership timeline: soft delete with `left_at`

**Problem**: A member leaves the group mid-month. Should their old expenses still affect their balance? Should new expenses include them?

**Options**:
1. **Hard delete** the member; their historical expenses remain
2. **Soft delete** with `left_at` timestamp
3. **Hard delete + re-add** with `joined_at`

**Decision**: Soft delete with `left_at`.

**Reasoning**:
- "Sam moved in April, Meera left March" is the core scenario. With soft delete, we can:
  - Exclude Meera from expenses dated after she left (only show her on rent paid before April)
  - Include Sam on April expenses onwards
- Hard-deleting would lose the audit trail ("when did this person join/leave?").

**Tradeoffs**:
- Slightly more complex queries (`left_at IS NULL` everywhere).
- The `_is_member_on_date()` check requires careful comparison of `joined_at` and `left_at` against the expense's date - including timezone-aware handling (we use `time.max` on the date to be inclusive).

---

## D08 - Balance calculation: per-expense + per-settlement

**Problem**: How to compute each user's net balance.

**Options**:
1. **Sum everything** - total paid minus total owed
2. **Detailed breakdown** - each expense and settlement listed
3. **Graph-based minimum cash flow** (debt simplification)

**Decision**: Detailed breakdown per expense + per settlement.

**Reasoning**:
- The assignment requires "balance transparency" (Rohan's request): "show exactly which expenses make up my balance".
- A graph-based minimum cash flow gives the smallest number of payments but obscures which underlying expenses caused the balance.
- The full breakdown is computed at query time and returned in the response. For a 42-row CSV, performance is fine.

**Tradeoffs**:
- Larger response payloads.
- Doesn't auto-suggest "X should pay Y ₹Z to settle up". We added a link to a detailed view but no settlement optimizer.

---

## D09 - Frontend stack: React + Vite + TanStack Query

**Problem**: Pick a frontend stack.

**Options**:
1. **React + Vite + TanStack Query** (chosen)
2. **Next.js** - full-stack, server components
3. **Svelte / Vue** - different framework

**Decision**: React + Vite + TanStack Query

**Reasoning**:
- Vite gives near-instant dev startup and fast HMR.
- TanStack Query handles server state, caching, optimistic updates, invalidation. This matters for the import flow where we want the dashboard to reflect changes immediately.
- React is what we know best; switching to Next.js would have added server-component complexity we didn't need.

**Tradeoffs**:
- No SSR - slower first paint on initial load.
- Vite has some plugin quirks; the React 19 + TS 6 combo occasionally throws deprecation warnings (we set `ignoreDeprecations: "6.0"`).

---

## D10 - Performance: bulk DB operations for CSV import

**Problem**: Initial implementation did `session.add()` + `session.flush()` per row, taking 25+ seconds for a 42-row CSV.

**Decision**: Batch all expense and participant inserts, single flush at the end.

**Reasoning**:
- With 42 rows × ~4 participants = ~168 inserts, plus 50 anomaly updates. Per-row flushes mean 218 round trips to the DB.
- Batching with `session.bulk_save_objects()` and a single final `flush()` collapses this to 2-3 round trips.
- For the bulk-approve endpoint, we replaced the Python loop with a single `UPDATE … WHERE user_decision IS NULL` SQL statement - 10x faster.

**Tradeoffs**:
- Batched inserts bypass some SQLAlchemy ORM features (e.g., relationship loading). For our use case (write-only imports), this is fine.

---

## D11 - Currency handling: store original, no auto-conversion

**Problem**: The CSV has USD expenses mixed with INR (Goa trip booked on intl site).

**Options**:
1. **Convert at import time** using a hardcoded FX rate
2. **Convert at display time** using a live API
3. **Store original, show as-is**

**Decision**: Store original currency, show as-is.

**Reasoning**:
- Hardcoded FX rates go stale immediately.
- A live FX API requires a key, adds latency, and is one more point of failure.
- Mixing currencies in a balance is conceptually fine - each expense is in its own currency, the balance reflects "what you owe" in each currency independently.

**Tradeoffs**:
- The total "what you owe" across currencies doesn't sum meaningfully. We display each currency separately.

---

## D12 - Deployment: split frontend (Vercel) + backend (Render)

**Problem**: Where to host the two apps.

**Decision**: Vercel for frontend, Render for backend, Neon for database.

**Reasoning**:
- Vercel is purpose-built for static / SPA frontends. Free tier covers small projects.
- Render is the simplest PaaS for Python - `pip install -r requirements.txt` + `gunicorn` start command, free tier with a Postgres add-on (we use Neon directly for portability).
- Neon gives a free PostgreSQL with branching (useful for staging environments).

**Tradeoffs**:
- Render's free tier sleeps after 15 min of inactivity - first request after sleep takes ~30 seconds. We mitigate by keeping the demo URL in a warm-up cron (out of scope for this assignment).
- Render's default Python version was 3.14 at one point, which broke `pydantic-core` compilation. We pin `pythonVersion: 3.12.4` in `render.yaml` to force a known-good version.

---

## D13 - Anomaly grouping: deduplicate identical issues in UI

**Problem**: The CSV produces 24 separate "Meera is not a member" anomalies - overwhelming to review.

**Decision**: Group anomalies by `anomaly_type + triggering value` in the review UI and the report.

**Reasoning**:
- Reviewing 50 separate rows when 80% are the same issue is bad UX.
- One click on "Approve" should apply to all rows in the group.
- The grouped view still shows the affected row numbers so nothing is hidden.

**Tradeoffs**:
- If the user wants per-row override (e.g., approve 23 of 24 but reject one), they have to ungroup. We provide an "expand" button for this.

---

## D14 - Optimistic UI for bulk-approve

**Problem**: Approve-All was taking 10+ seconds, during which the UI showed no feedback.

**Decision**: Use React Query's optimistic mutation pattern - apply changes to the local cache immediately, rollback on error.

**Reasoning**:
- Server still processes the request, but UI updates before the round-trip completes.
- If the server fails, we rollback the cache and show an error toast.
- Combined with the backend bulk UPDATE (D10), the full Approve-All is now < 1.5 seconds end-to-end.

**Tradeoffs**:
- Risk of "ghost approvals" if the rollback fails (unlikely with React Query).

---

## D15 - Dark theme throughout

**Problem**: UI theme choice.

**Decision**: Pure black (`#000`) background with white text and subtle gray accents.

**Reasoning**:
- The product handles financial data; a clean, minimal aesthetic reduces cognitive load.
- Black background makes accent colors (red for errors, green for success, yellow for warnings) pop, which is critical for the anomaly review UI.
- All borders are `border-gray-800` (subtle but visible) with `border-2` on focusable inputs (white) for clear interactive feedback.

**Tradeoffs**:
- Less accessible to users with low-vision conditions. We rely on contrast ratios that meet WCAG AA but not AAA.
