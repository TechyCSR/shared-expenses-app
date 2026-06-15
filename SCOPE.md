# Anomaly Log & Data Model Reference

This document is the canonical reference for:
1. Every data issue present in `expenses_export.csv`
2. How each issue is detected
3. The handling policy chosen
4. Whether user review is required
5. The database schema, tables, and relationships

---

## 1. The CSV Under Test

**File**: `expenses_export.csv` (42 data rows, 9 columns)
**Columns**: `date, description, paid_by, amount, currency, split_type, split_with, split_details, notes`

The CSV deliberately contains at least 12 distinct data problems. They are documented below, grouped by type, with the exact rows where each appears.

---

## 2. Anomaly Catalog

Each anomaly lists:
- **Type** - machine identifier
- **Severity** - `error` (blocks commit) / `warning` (allows commit with note) / `info`
- **Detection** - how we find it
- **Default policy** - what happens on bulk-approve
- **User review?** - yes / no
- **Affected rows** in `expenses_export.csv`

### 2.1 `ambiguous_date`
- **Severity**: warning
- **Detection**: Date is in `DD/MM/YYYY` or `MM/DD/YYYY` format and both interpretations are valid (day ≤ 12).
- **Default policy**: assume `DD/MM/YYYY` (Indian context - group default currency is INR)
- **User review**: optional (warning, not error)
- **Why**: Indian groups use DD/MM first. Bulk-approve preserves this interpretation.
- **Affected rows**: 5, 8, 9, 10, 11, 18, 19, 20, 21, 22, 23, 24, 25, 33

### 2.2 `currency_mismatch_group`
- **Severity**: warning
- **Detection**: `currency` field differs from group default (`INR` for our test group).
- **Default policy**: keep original currency - each expense stores its own currency. Group default is for display only.
- **User review**: optional
- **Why**: Goa trip was paid in USD on an intl booking site. Don't convert without user say-so.
- **Affected rows**: 19, 20, 22, 25

### 2.3 `invalid_currency`
- **Severity**: error
- **Detection**: `currency` field is empty or not a known ISO code.
- **Default policy**: use group default currency (`INR`).
- **User review**: required (error)
- **Affected rows**: 15

### 2.4 `missing_payer`
- **Severity**: error
- **Detection**: `paid_by` field is empty.
- **Default policy**: skip the row - cannot record who paid.
- **User review**: required (error)
- **Affected rows**: 12

### 2.5 `unknown_participant` (incl. payer)
- **Severity**: error
- **Detection**: name in `paid_by` or `split_with` doesn't fuzzy-match any active group member.
- **Default policy**: drop the row's contribution from the import (or skip entirely if it's the payer).
- **User review**: required (error)
- **Special case**: phrases like `"Dev's friend Kabir"` are token-extracted and resolved to `Kabir` automatically.
- **Affected rows**: 1, 2, 3, 6, 7, 9, 10, 11, 12, 14, 15, 16, 17, 22 (row 22 has the phrase), 27, 28, 29, 30, 31, 32, 35 - i.e., all rows that mention `Meera` (who is no longer a member).

### 2.6 `name_fuzzy_mismatch`
- **Severity**: warning
- **Detection**: name didn't match exactly but token match / prefix match / substring match succeeded.
- **Default policy**: approve the fuzzy match (it worked, just want to flag).
- **User review**: optional
- **Affected rows**: 22 (`"Dev's friend Kabir"` → `Kabir`)

### 2.7 `case_mismatch`
- **Severity**: warning (rolled into `unknown_participant` if no match)
- **Detection**: e.g., `priya` vs `Priya`.
- **Default policy**: case-insensitive match.
- **Affected rows**: 7 (`priya`)

### 2.8 `name_variation` (Priya vs Priya S)
- **Severity**: warning
- **Detection**: Both `"Priya"` and `"Priya S"` appear in the CSV. Our matcher picks the more common one (`Priya`) by default.
- **Default policy**: map both to the same member (first match wins).
- **Affected rows**: 10 (`Priya S`)

### 2.9 `negative_amount`
- **Severity**: warning
- **Detection**: `amount < 0`.
- **Default policy**: convert to settlement OR keep as expense with warning. We default to keep (user can convert manually).
- **Affected rows**: 25 (`-30` Parasailing refund)

### 2.10 `zero_amount`
- **Severity**: error
- **Detection**: `amount == 0`.
- **Default policy**: skip - placeholders are not real expenses.
- **User review**: required
- **Affected rows**: 30 (Swiggy dinner)

### 2.11 `invalid_split_type`
- **Severity**: error
- **Detection**: `split_type` empty or not in `[equal, unequal, percentage, shares]`.
- **Default policy**: treat as `equal`.
- **User review**: required (error)
- **Affected rows**: 13

### 2.12 `invalid_percentages`
- **Severity**: error
- **Detection**: `split_details` percentages don't sum to 100%.
- **Default policy**: **normalize proportionally** (scale each so they sum to 100%).
- **Why we normalize**: it's almost always a typo (e.g., 30+30+30+20 = 110%) - normalizing gives correct proportional shares.
- **Affected rows**: 14 (110%), 31 (110%)

### 2.13 `split_details_format_mismatch`
- **Severity**: warning
- **Detection**: `split_type=equal` but `split_details` contains values.
- **Default policy**: ignore `split_details` for equal splits.
- **Affected rows**: 40

### 2.14 `settlement_as_expense`
- **Severity**: warning
- **Detection**: description matches settlement keywords (`paid back`, `deposit share`, etc.).
- **Default policy**: keep as expense (user can re-categorize manually).
- **Why**: false positives are easy (e.g., "Sam deposit share" is technically a deposit, not a settlement, even though our keywords match).
- **Affected rows**: 13, 37

### 2.15 `duplicate_within_csv`
- **Severity**: warning
- **Detection**: same (date, description, amount, payer) tuple appears twice in the CSV.
- **Default policy**: keep both rows. Reviewer manually deduplicates.
- **Why**: we can't tell which is authoritative without more info.
- **Affected rows**: 4 & 5 (`Marina Bites` dinner logged twice)

### 2.16 `duplicate_with_existing`
- **Severity**: warning
- **Detection**: row is similar to an expense already in the group's database.
- **Default policy**: keep both.

### 2.17 `member_not_active_on_date`
- **Severity**: info
- **Detection**: `paid_by` user or participant was not a member on the expense date (per `joined_at` / `left_at`).
- **Default policy**: include the expense but exclude inactive users from participants.
- **Why**: keeps historical data correct. Sam moving in April doesn't get charged for February rent.

### 2.18 `unparseable_date`
- **Severity**: error
- **Detection**: date doesn't match any known format.
- **Default policy**: skip the row.
- **Affected rows**: 26 (`Mar 14` parsed OK, but exotic formats like "Feb 30" would fail)

---

## 3. Anomaly Grouping

In the UI and report, identical anomalies (same `anomaly_type` + same triggering value) are **grouped together** for review. For example:

| Group | Rows | Type | Trigger |
|-------|------|------|---------|
| 1 | 24 occurrences | `unknown_participant` | `"Meera"` not a member |
| 2 | 13 occurrences | `ambiguous_date` | `DD/MM/YYYY` vs `MM/DD/YYYY` |
| 3 | 4 occurrences | `currency_mismatch_group` | `"USD"` ≠ `INR` |
| 4 | 2 occurrences | `invalid_percentages` | Sum 110% |
| 5 | 2 occurrences | `settlement_as_expense` | Description keywords |
| 6 | 1 each | `missing_payer`, `invalid_split_type`, `name_fuzzy_mismatch`, `negative_amount`, `invalid_currency`, `zero_amount`, `split_details_format_mismatch` | - |

When you click "Approve All" on the grouped view, the decision applies to **all rows** in the group.

---

## 4. Database Schema

### 4.1 Entity-Relationship Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    users    │◄────────│ group_      │────────►│   groups    │
│             │  N:1    │  members    │  N:1    │             │
└─────────────┘         └─────────────┘         └─────────────┘
       ▲                                                ▲
       │ N:1                                            │ 1:N
       │                                                │
┌─────────────┐                                ┌─────────────┐
│  expenses   │────────────────────────────────│  expenses   │
│  (paid_by)  │                                │  (group_id) │
└─────────────┘                                └─────────────┘
       ▲
       │ 1:N
       │
┌──────────────────┐                  ┌──────────────────┐
│ expense_         │                  │   settlements    │
│ participants     │                  │   (from→to)      │
└──────────────────┘                  └──────────────────┘

┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  import_jobs     │───►│import_anomalies  │    │ import_reports   │
│                  │    │                  │    │                  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

### 4.2 Tables

#### `users`
Stores every Clerk user that signs in.
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | internal |
| `clerk_id` | VARCHAR UNIQUE | Clerk external ID |
| `email` | VARCHAR | |
| `full_name` | VARCHAR NULL | |
| `avatar_url` | VARCHAR NULL | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### `groups`
A shared-expenses workspace.
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `name` | VARCHAR | |
| `description` | TEXT NULL | |
| `default_currency` | VARCHAR(3) | e.g. `INR` |
| `created_by` | UUID FK → users | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### `group_members`
Many-to-many with timeline.
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `group_id` | UUID FK → groups | ON DELETE CASCADE |
| `user_id` | UUID FK → users | |
| `role` | VARCHAR(50) | `admin` or `member` |
| `joined_at` | TIMESTAMPTZ | when user joined |
| `left_at` | TIMESTAMPTZ NULL | when user left (NULL = active) |

**Constraint**: `UNIQUE(group_id, user_id, joined_at)` - a user can leave and rejoin.

#### `expenses`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `group_id` | UUID FK → groups | ON DELETE CASCADE |
| `paid_by` | UUID FK → users | |
| `amount` | NUMERIC(15,4) | always > 0 (CHECK) |
| `currency` | VARCHAR(3) | |
| `description` | TEXT | |
| `expense_date` | DATE | |
| `split_type` | VARCHAR(20) | `equal` / `unequal` / `percentage` / `shares` |
| `notes` | TEXT NULL | |
| `created_by` | UUID FK → users | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**Indexes**: `(group_id, expense_date)` for fast range queries.

#### `expense_participants`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `expense_id` | UUID FK → expenses | ON DELETE CASCADE |
| `user_id` | UUID FK → users | ON DELETE CASCADE |
| `share_value` | NUMERIC(15,4) NULL | raw value from `split_details` |
| `amount_owed` | NUMERIC(15,4) | computed share |

**Constraint**: `UNIQUE(expense_id, user_id)` - one row per user per expense.

#### `settlements`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `group_id` | UUID FK → groups | |
| `from_user_id` | UUID FK → users | who paid |
| `to_user_id` | UUID FK → users | who received |
| `amount` | NUMERIC(15,4) | |
| `currency` | VARCHAR(3) | |
| `settlement_date` | DATE | |
| `notes` | TEXT NULL | |
| `created_by` | UUID FK → users | |
| `created_at` | TIMESTAMPTZ | |

#### `import_jobs`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `group_id` | UUID FK → groups | |
| `uploaded_by` | UUID FK → users | |
| `filename` | VARCHAR(255) | |
| `original_csv` | TEXT | raw CSV for re-parse on commit |
| `status` | VARCHAR(30) | `parsed` / `reviewing` / `ready` / `completed` |
| `total_rows`, `imported_rows`, `rejected_rows` | INT | |
| `created_at`, `completed_at` | TIMESTAMPTZ | |

#### `import_anomalies`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `import_job_id` | UUID FK → import_jobs | ON DELETE CASCADE |
| `row_number` | INT | 1-indexed in original CSV |
| `anomaly_type` | VARCHAR(50) | see catalog above |
| `severity` | VARCHAR(20) | `error` / `warning` / `info` |
| `message` | TEXT | human-readable |
| `suggested_action` | JSONB NULL | what the user can do |
| `raw_row_data` | JSONB | the full CSV row |
| `user_decision` | VARCHAR(20) NULL | `approve` / `reject` |
| `user_resolution` | JSONB NULL | user's override, if any |
| `created_at`, `resolved_at` | TIMESTAMPTZ | |

#### `import_reports`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `import_job_id` | UUID FK → import_jobs | UNIQUE |
| `report_data` | JSONB | counts, anomaly details, rejection reasons, policy |
| `generated_at` | TIMESTAMPTZ | |

### 4.3 Assumptions

1. **Single-currency expenses**: each `expense` row stores its own `currency`. Balances within a group are computed per-user but stored as strings; we don't auto-convert across currencies. The Dashboard shows them as-is.
2. **Membership timeline**: `joined_at` and `left_at` are TIMESTAMPTZ. `is_active()` checks `now BETWEEN joined_at AND left_at`. For historical expenses, we use the expense's date instead of `now`.
3. **Soft delete for members**: we don't hard-delete memberships; we set `left_at`. This preserves expense history.
4. **Anomaly UUIDs**: anomaly `suggested_action.options` may contain `user_id`s. These are serialized as strings (never UUID objects) to avoid JSON serialization errors.
5. **Decimal precision**: amounts stored as `NUMERIC(15,4)` (4 decimal places) but UI strips trailing zeros via `formatAmount()`.
6. **Payer membership on expense date**: required. Backend validates the payer was an active member on the date the expense occurred (using `joined_at <= date AND (left_at IS NULL OR left_at > date)`).
7. **Duplicate participants**: deduped by `user_id` before insert (same person listed twice in `split_with` doesn't create two shares).
