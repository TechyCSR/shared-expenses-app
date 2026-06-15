# Shared Expenses App

A full-stack shared expense management application that lets groups track expenses, settle balances, and import messy CSV files with automatic anomaly detection.

## Problem Statement

Groups of people living together (flatmates, travel buddies, project teams) regularly need to split bills. The hard part is rarely the math - it's the data quality:

- One person logs "Dinner at Marina Bites" for ₹3200. Another logs "dinner - marina bites" for the same amount on the same day.
- A member moves out mid-month but is still listed in every expense after that.
- The CSV uses different date formats (`2026-02-01`, `01/03/2026`, `Mar 14`) and currencies (USD vs INR).
- A "Rohan paid Aisha back" row is actually a settlement, not an expense.
- Percentages sum to 110%, not 100%.

This app accepts that data is messy. It detects anomalies, surfaces them to the user, lets the user decide what to do, and finally imports only the rows they approve.

## Features

### Core
- **Authentication**: Clerk-based sign-up / sign-in (email + social)
- **Groups**: Create, rename, delete groups; default currency per group
- **Members**: Add/remove members with admin role support
- **Expenses**: Create, edit, delete expenses with four split types:
  - **Equal** - split evenly among participants
  - **Unequal** - exact amount per participant (proportional backend)
  - **Percentage** - share by % (auto-normalized if ≠ 100%)
  - **Shares** - share by integer ratio (e.g., 2:1:1)
- **Settlements**: Record "A paid B back" style payments
- **Balances**: Per-user net balance with full breakdown
- **CSV Import**: Upload `expenses_export.csv`, review anomalies, bulk-approve/reject, commit
- **Import Report**: Auto-generated Markdown report listing every anomaly and action

### Member Timeline
- Members can have `joined_at` / `left_at` dates
- Balances only include members active on each expense's date
- "Sam moved in April" - March expenses don't affect April's balance for Sam

### Anomaly Detection
The importer detects (and groups together duplicates):
- Unknown participant names (incl. phrases like "Dev's friend Kabir")
- Case-mismatched payer names (`priya` vs `Priya`)
- Multiple name variations (`Priya` vs `Priya S`)
- Ambiguous dates (`DD/MM` vs `MM/DD`)
- Currency mismatch with group default
- Missing/empty currency, amount, payer
- Negative amounts (likely refunds)
- Zero amounts (placeholders)
- Percentage splits summing ≠ 100%
- Split details mismatch (`equal` but with share values)
- Settlement-looking rows (`paid back`, `deposit share`)
- Duplicates within CSV and against existing group expenses
- Members not active on the expense date

## Tech Stack

### Backend
- **Python 3.12** + **Flask 3**
- **Flask-SQLAlchemy** + **Flask-Migrate** (Alembic)
- **PostgreSQL** (Neon recommended) or SQLite for local dev
- **Pydantic v2** for request validation
- **Flask-JWT-Extended** for JWT issuance
- **Clerk** for production authentication (JWKS validation)
- **Gunicorn** WSGI server

### Frontend
- **React 19** + **TypeScript 6**
- **Vite 8** build tool
- **React Router 7**
- **TanStack Query 5** for server state + optimistic updates
- **Clerk React** for auth UI
- **Tailwind CSS 4**
- **Axios** for HTTP

## Project Structure

```
shared-expenses-app/
├── backend/                  # Flask API → Render
│   ├── app/
│   │   ├── api/             # HTTP blueprints (auth, groups, expenses, etc.)
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic (anomaly_service, csv_import_service, etc.)
│   │   ├── utils/           # Helpers (dates, currency, exceptions)
│   │   ├── config.py        # Settings (env-driven)
│   │   ├── extensions.py    # Flask extension setup
│   │   └── __init__.py      # App factory
│   ├── migrations/          # Alembic migrations
│   ├── tests/               # Pytest tests
│   ├── render.yaml          # Render deploy config
│   ├── Procfile             # gunicorn process file
│   ├── runtime.txt          # Python version pin
│   ├── .python-version      # Alternative Python pin
│   ├── requirements.txt     # Python dependencies
│   └── main.py              # WSGI entrypoint
│
├── frontend/                # React SPA → Vercel
│   ├── src/
│   │   ├── components/      # Shared UI (Layout, Loading)
│   │   ├── pages/           # Route-level components
│   │   │   ├── import/      # CSV import flow
│   │   │   ├── groups/      # Group list/detail/settings
│   │   │   ├── expenses/    # Create/edit/list expense
│   │   │   ├── balances/    # Balance view
│   │   │   └── settlements/ # Settlement form
│   │   ├── services/        # API client
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Helpers (cn, format)
│   │   ├── App.tsx          # Router + AuthSync
│   │   └── main.tsx         # Entry
│   ├── vercel.json          # Vercel build config
│   ├── .env.example         # Env var template
│   └── package.json
│
├── README.md                # ← you are here
├── SCOPE.md                 # Anomaly log + data model reference
├── DECISIONS.md             # Engineering decision log
├── AI_USAGE.md              # AI-assisted development notes
└── DEPLOYMENT.md            # Step-by-step deployment guide
```

## Local Development

### Prerequisites
- Python 3.12+
- Node.js 20+
- (Optional) PostgreSQL - SQLite works for dev with no setup

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # edit if needed
flask run                  # → http://localhost:5000
```

The backend defaults to **SQLite + Clerk disabled**, so you can log in with the dev email flow. To use Clerk, set `CLERK_ENABLED=true` in `.env` and provide Clerk keys.

### Frontend
```bash
cd frontend
npm install
cp .env.example .env       # edit if needed
npm run dev                # → http://localhost:5173
```

### First-time DB setup
```bash
cd backend && source venv/bin/activate
alembic upgrade head
```

## Environment Variables

### Backend (`backend/.env`)
See `backend/.env.example` for the full list. Key vars:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | `postgresql://…` (prod) or `sqlite:///./shared_expenses.db` (dev) |
| `JWT_SECRET_KEY` | Random secret for signing internal JWTs |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `CLERK_ENABLED` | `true` in production |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_ISSUER` | Your Clerk instance issuer URL |

### Frontend (`frontend/.env`)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend base URL, e.g. `http://localhost:5000/api/v1` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |

## Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for a full walkthrough.

**TL;DR**:
- **Backend** → [Render](https://render.com), using `backend/render.yaml`
- **Frontend** → [Vercel](https://vercel.com), using `frontend/vercel.json`
- **Database** → [Neon](https://neon.tech) free PostgreSQL
- **Auth** → [Clerk](https://dashboard.clerk.com) production instance

## Documentation Files

- [`SCOPE.md`](./SCOPE.md) - anomaly log, handling policy, data model, schema
- [`DECISIONS.md`](./DECISIONS.md) - engineering decisions with rationale
- [`AI_USAGE.md`](./AI_USAGE.md) - AI-assisted development notes with worked examples
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) - deployment walkthrough
