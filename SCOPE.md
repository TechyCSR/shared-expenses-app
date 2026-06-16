# What I Found While Building This Thing

A plain-English log of all the weird stuff I ran into while building this app. I write this so future me (or anyone else) can understand *why* the code looks the way it does.

This file covers:
1. The CSV file we use for testing and every problem I found in it
2. How I decided to handle each problem (the policy)
3. The database schema (boring but you need it)
4. Assumptions I baked in (also at the bottom)

---

## 1. The CSV File

**File**: `expenses_export.csv`
**Rows**: 42 (plus 1 header row)
**Columns**: `date, description, paid_by, amount, currency, split_type, split_with, split_details, notes`

This is a real-looking export from a group of friends sharing expenses over a few months. I picked it on purpose because it has a lot of messy, real-world problems baked in — it's the kind of CSV that someone would actually hand you, not a clean sample file.

I went through the file row by row and kept notes on every weird thing. Below is everything I found.

---

## 2. The Problems I Found (One by One)

I went through the CSV and asked myself: "what would trip up my import code?" Here's the list.

### 2.1 Dates are written in different formats

Some dates are `2026-02-01` (ISO), some are `01/03/2026` (DD/MM/YYYY), and one is just `Mar 14`. That's three different styles in one file.

**Why this matters**: If I don't parse all three, half the file fails to load.

**What I did**: My parser tries ISO first, then DD/MM/YYYY, then MM/DD/YYYY, then a few named-month formats. I default to DD/MM/YYYY when it's ambiguous (because the group uses INR and feels Indian).

**Affected rows**: 13 of them (rows 16–28 are mostly DD/MM/YYYY, row 27 is the weird `Mar 14` one).

### 2.2 The same date can mean two things

For dates like `01/03/2026`, it could be January 3 or March 1. In this group, March 1 makes sense (rent is paid at the start of the month), so I default to DD/MM/YYYY.

**What I did**: Treat it as DD/MM/YYYY by default but flag it so the user can override if needed.

**Affected rows**: 13.

### 2.3 Currency is sometimes missing

Row 27 (`Groceries DMart`) has no currency. The note says "forgot to set currency".

**What I did**: Show this as an error during import. Fall back to the group's default currency (INR for this group) but make the user confirm.

### 2.4 Some expenses are in USD, not INR

The Goa trip (rows 19, 20, 22, 25) was paid in USD on an international site. The user kept the original currency rather than converting.

**What I did**: I don't auto-convert. Each expense keeps its own currency. Balances are shown in whatever currency they were paid in.

**Affected rows**: 4 (the Goa ones).

### 2.5 The "paid by" field is empty sometimes

Row 12 (`House cleaning supplies`) has nobody listed. The note says "can't remember who paid".

**What I did**: This is a blocker. Without knowing who paid, I can't create the expense. The row gets flagged as an error and the user has to fill it in or skip it.

### 2.6 Names don't match exactly — casing issues

Row 7 says `priya` (lowercase) but the member is `Priya`. Same person, just typed wrong.

**What I did**: My matcher is case-insensitive. So `priya` = `Priya` = `PRIYA`.

### 2.7 Two people called Priya

There are `Priya` and `Priya S` in the group. The CSV uses both, sometimes in the same row's split list. I had to pick one when there's no other way to tell them apart.

**What I did**: First-match-wins. So `Priya` (without the S) maps to the user named `Priya`. `Priya S` maps to the user named `Priya S`. If the user wants to override, they can in the review screen.

### 2.8 Names with extra words: "Dev's friend Kabir"

Row 22 has `"Dev's friend Kabir"` in the split list. The actual member is just `Kabir`.

**What I did**: My fuzzy matcher tokenizes the string and looks for a name that appears inside it. `Dev's friend Kabir` → `Kabir`. Same for `"Sam"` → `Sam`, etc. If no name matches at all, I flag it.

### 2.9 Negative amounts (refunds)

Row 25 has `-30` for "Parasailing refund" because one slot got cancelled.

**What I did**: I allow negative amounts and just show a warning. The user can decide whether to keep it as a negative expense or convert it into a settlement from the operator to everyone who chipped in.

### 2.10 Zero amounts (placeholders)

Row 30 has `0` for "Dinner order Swiggy" with the note "counted twice earlier - fixing later". It's a placeholder, not a real expense.

**What I did**: Block it. Zero-amount rows get rejected. Better to skip than to create a fake expense.

### 2.11 Percentages that don't add to 100%

Row 14 (`Pizza Friday`) has `Aisha 30%; Rohan 30%; Priya 30%; Meera 20%` — that's 110%, not 100%. Same with row 31.

**What I did**: I normalize proportionally. So the four become ~27.3% / 27.3% / 27.3% / 18.2%, which add up to 100. Almost always it's just a typo, and this gives the right proportional split.

### 2.12 Equal split but shares are written anyway

Row 40 (`Furniture for common room`) has `split_type=equal` but `split_details` contains `Aisha 1; Rohan 1; Priya 1; Sam 1`. The note even says "split_type says equal but someone added shares anyway".

**What I did**: Ignore the `split_details` when `split_type=equal`. Just split equally.

### 2.13 Split type is empty

Row 13 (`Rohan paid Aisha back`) has no `split_type`. This is a settlement, not an expense. I detect this and convert it into a Settlement record instead.

**What I did**: If `split_type` is empty AND the description matches settlement words ("paid back", "deposit share", etc.) AND only one person is in `split_with`, I treat the row as a settlement and skip the expense creation.

### 2.14 Settlements mixed in with expenses

Several rows are actually settlements, not expenses:
- Row 13: `Rohan paid Aisha back, 5000` (settlement)
- Row 37: `Sam deposit share, 15000` (deposit split, kind of settlement-like)

**What I did**: My settlement detector looks for keywords like "paid back", "deposit share", and any negative amount. When matched, I create a Settlement record instead of an Expense. Otherwise I keep it as an expense with a warning.

### 2.15 Duplicates within the CSV

Rows 4 and 5 are both `dinner at Marina Bites` on the same date, same amount, same payer. Logged twice.

**What I did**: I flag both as duplicates but don't auto-dedupe. I can't tell which is the "real" one, so the user picks.

### 2.16 Duplicates with existing expenses in the database

Same idea but against expenses already imported from a previous CSV.

**What I did**: Flag with a warning. Don't auto-merge.

### 2.17 Someone who's not a member anymore is still in the splits

Meera left the group at the end of March. But rows 32, 33, 34, 36 still mention her in the split list. These would fail validation because she's no longer an active member.

**What I did**: My member-validation logic checks the expense's date against each person's `joined_at` / `left_at`. If the person was a member on that date, they're allowed. After Meera's `left_at`, any row listing her gets an `unknown_participant` error and the user has to drop her from the split.

### 2.18 Members who joined late are charged from day one

Sam joined the group in April. But if I include him in any February or March expense, that's wrong.

**What I did**: Same date-based check. Sam only gets included in expenses dated on or after his `joined_at`.

### 2.19 Currency is `INR` but the trip was in Goa with USD expenses

The group's default currency is INR, but the Goa expenses are in USD. I don't convert — each row keeps its own currency.

### 2.20 Numbers have commas in them

Row 6 (`Electricity Feb`) has `1,200` as the amount.

**What I did**: Strip commas before parsing. So `1,200` becomes `1200.00`.

### 2.21 Whitespace around amounts

Row 28 (`Electricity Mar`) has ` 1450 ` with spaces around it.

**What I did**: Trim whitespace before parsing.

### 2.22 Equal split with only one person

Row 37 (`Sam deposit share`) has `split_with = Aisha` — just one person.

**What I did**: Treat as settlement if there's no split_type and the description matches settlement words.

---

## 3. How I Group Anomalies in the UI

When the user opens the review screen, I don't show 42 separate warnings. I group them by anomaly type + the exact problem. For example:

| Group | How many rows | What the problem is |
|-------|---------------|---------------------|
| 1 | 24 rows | `Meera` shows up but she's no longer a member |
| 2 | 13 rows | Date is in DD/MM/YYYY — could be misread as MM/DD/YYYY |
| 3 | 4 rows | Currency is USD on a group that defaults to INR |
| 4 | 2 rows | Percentages add up to 110% instead of 100% |
| 5 | 2 rows | Description looks like a settlement but the row was imported as an expense |
| 6 | 1 each | Missing payer, empty currency, zero amount, weird `Mar 14` date, etc. |

When the user clicks "Approve All" on a group, it applies to every row in that group.

---

## 4. What Anomaly Types I Built

Here's the full list. I gave each one a stable ID so the code can branch on it.

| ID | Severity | What it means |
|----|----------|---------------|
| `ambiguous_date` | warning | Date could be DD/MM or MM/DD — confirm |
| `unparseable_date` | error | Date doesn't match any format I know |
| `currency_mismatch_group` | warning | Currency isn't the group's default |
| `invalid_currency` | error | Currency is empty or unknown |
| `missing_payer` | error | `paid_by` is empty |
| `unknown_participant` | error | A name in the row doesn't match any member |
| `name_fuzzy_mismatch` | warning | Name matched but only via fuzzy logic |
| `case_mismatch` | warning | Casing was off but matched anyway |
| `name_variation` | warning | Two members share a name (Priya vs Priya S) |
| `negative_amount` | warning | Amount is negative (refund?) |
| `zero_amount` | error | Amount is zero — looks like a placeholder |
| `invalid_split_type` | error | `split_type` is empty or not one of the four valid ones |
| `invalid_percentages` | error | Percentages don't add up to 100 |
| `split_details_format_mismatch` | warning | `split_details` is filled but `split_type=equal` |
| `settlement_as_expense` | warning | Description looks like a settlement |
| `duplicate_within_csv` | warning | Same row appears twice in the CSV |
| `duplicate_with_existing` | warning | Row matches something already in the database |
| `member_not_active_on_date` | info | User wasn't a member on the expense date |

---

## 5. The Database Schema

### 5.1 How the Tables Connect

```
users ──┐
        │ (member of)
        ▼
    group_members ◄──── groups
        │                   │
        │                   │ (owns)
        │                   ▼
        │              expenses
        │                   │
        │                   │ (split between)
        │                   ▼
        │          expense_participants
        │
        └──── (paid_by, paid_to) ──── settlements

import_jobs ──► import_anomalies
import_jobs ──► import_reports
```

### 5.2 The Tables

#### `users`
Every person who signs up with Clerk.
- `id` — UUID, primary key (our internal ID)
- `clerk_id` — Clerk's external ID, unique
- `email`
- `full_name` — nullable
- `avatar_url` — nullable
- `created_at`, `updated_at`

#### `groups`
A shared-expenses workspace.
- `id` — UUID, primary key
- `name`
- `description` — nullable
- `default_currency` — like `INR`
- `created_by` — who made the group
- `created_at`, `updated_at`

#### `group_members`
Who's in which group, and when.
- `id` — UUID
- `group_id` — which group
- `user_id` — which user
- `role` — `admin` or `member`
- `joined_at` — when they joined
- `left_at` — when they left (NULL = still active)

**Important**: a user can leave and rejoin. The unique constraint is `(group_id, user_id, joined_at)` so the same person can have multiple rows for different time windows.

#### `expenses`
Every expense that ever happened.
- `id` — UUID
- `group_id`
- `paid_by` — who actually paid
- `amount` — always positive (database enforces this)
- `currency`
- `description`
- `expense_date`
- `split_type` — `equal`, `unequal`, `percentage`, or `shares`
- `notes` — nullable
- `created_by`, `created_at`, `updated_at`

I index on `(group_id, expense_date)` so date-range queries are fast.

#### `expense_participants`
The "split between" list for each expense.
- `id` — UUID
- `expense_id`
- `user_id`
- `share_value` — what they wrote in the CSV (nullable)
- `amount_owed` — what they actually owe

Unique constraint on `(expense_id, user_id)` so the same person listed twice doesn't create two rows.

#### `settlements`
When one person pays another to settle up.
- `id` — UUID
- `group_id`
- `from_user_id` — who paid
- `to_user_id` — who received
- `amount`
- `currency`
- `settlement_date`
- `notes` — nullable
- `created_by`, `created_at`

#### `import_jobs`
Tracks each CSV upload.
- `id` — UUID
- `group_id`
- `uploaded_by`
- `filename`
- `original_csv` — full CSV text, stored so I can re-parse on commit
- `status` — `parsed`, `reviewing`, `ready`, or `completed`
- `total_rows`, `imported_rows`, `rejected_rows`
- `created_at`, `completed_at`

#### `import_anomalies`
Each problem found during parsing, for the review screen.
- `id` — UUID
- `import_job_id`
- `row_number` — which row in the original CSV
- `anomaly_type` — see the catalog above
- `severity` — `error`, `warning`, or `info`
- `message` — human-readable description
- `suggested_action` — JSON, optional, what the user can do
- `raw_row_data` — JSON, the whole CSV row
- `user_decision` — `approve` or `reject`, nullable
- `user_resolution` — JSON, nullable, the user's override
- `created_at`, `resolved_at`

#### `import_reports`
Summary of what got imported.
- `id` — UUID
- `import_job_id` — unique, one report per job
- `report_data` — JSON with counts, anomaly breakdown, policy used
- `generated_at`

---

## 6. Assumptions I Baked In

These are the things I just decided and didn't ask the user about. If any of them are wrong, the code needs to change.

1. **One currency per expense, no auto-conversion.** Each expense row stores its own currency. If a Goa villa is in USD and groceries are in INR, I keep them separate. I don't convert using exchange rates because (a) I don't have a reliable rate feed, and (b) the user might not want it. Balances are shown as-is.

2. **Memberships have a timeline.** `joined_at` and `left_at` are timestamps. "Active member" means `now BETWEEN joined_at AND left_at`. For historical expenses, "active" means "active on the expense's date". So Meera shows up in February expenses but not May ones.

3. **Members are soft-deleted.** Nobody gets removed from `group_members` outright. We just set `left_at`. This keeps the expense history accurate — Meera still has a row, she's just marked as left.

4. **Anomaly UUIDs get serialized as strings.** If the suggested action includes a `user_id`, I always send it as a string. UUID objects don't survive JSON serialization cleanly and I got bitten by this early on.

5. **Amounts are stored as decimals with 4 places, displayed with 2.** Backend stores `NUMERIC(15,4)`. The frontend trims trailing zeros for display. So `5000.0000` becomes `5000` on screen.

6. **The payer has to be an active member on the expense date.** I validate this on the backend before creating the expense. Can't pay if you weren't part of the group at that time.

7. **Duplicate participants are deduped.** If someone appears twice in `split_with` (e.g., `Priya;Priya`), I only create one participant row.

8. **Indian-style dates win.** When a date is ambiguous, I pick DD/MM/YYYY because the test group uses INR. If the group is in the US, this would be wrong — I'd flip the default.

9. **Percentages get normalized, not rejected.** When percentages don't sum to 100, I scale them proportionally. Almost always a typo (30+30+30+20 instead of 25+25+25+25), so normalizing gives correct shares.

10. **Settlement detection is keyword-based, not perfect.** I look for words like "paid back" and "deposit share" in the description. False positives are possible (e.g., "Sam deposit share" was a deposit, not a settlement). The user can always override in the review screen.

11. **Zero-amount rows are placeholders, not real expenses.** I reject them outright. If someone really owes $0, they don't need a row for it.

12. **CSV import never touches existing data unless explicitly told.** I never auto-update or merge. New CSV uploads only add new rows.

13. **Decimal precision is enough.** For rent of 48000 INR split 4 ways, that's 12000 each. No fractions of a paisa. The 4-decimal storage is just defensive.
