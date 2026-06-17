# What I Found While Building This App

> I am writing this so I can remember why the code for this app looks the way it does. I want to make sure that I can understand what I did and why I did it.

This file talks about the things I found while building this app.

The things I will talk about are:

1. The CSV file we use for testing and the problems I found in it
2. How I decided to handle each problem
3. The database schema
4. The things I assumed while building this app

---

## 1. The CSV File

The file is called `expenses_export.csv`. It has 42 rows plus one header row. The columns in this file are `date`, `description`, `paid_by`, `amount`, `currency`, `split_type`, `split_with`, `split_details` and `notes`.

This file is an example of what a group of friends might use to share expenses over a few months. I chose it because it has a lot of real-world problems that I would have to deal with.

I went through the file row by row. Wrote down every problem I found.

---

## 2. The Problems I Found

I went through the CSV file and asked myself what would cause problems for my import code.

### 2.1 Dates are written in different formats

Some dates are written like `2026-02-01` and some are written like `01/03/2026`. There is one date that is just written as `Mar 14`.

This is a problem because if I do not handle all of these formats some of the data will not be imported correctly.

What I did was make my parser try to understand the date in formats. If it is not clear what format the date is in I default to the format that is commonly used in the group.

This problem affected 13 rows in the file.

### 2.2 The same date can mean two things

For example the date `01/03/2026` could be January 3 or March 1. In this group it makes sense for it to be March 1 so that is what I default to.

What I did was make my code assume the date is in the format that is commonly used in the group but I also make a note of it so the user can change it if they need to.

This problem affected 13 rows.

### 2.3 Currency is sometimes missing

One of the rows does not have a currency listed. The note for that row says that the person forgot to enter the currency.

What I did was make my code show an error when it imports this row. I also make my code use the group's default currency. I make the user confirm that this is what they want to do.

### 2.4 Some expenses are in USD, not INR

Some of the expenses in the file are listed in USD, not INR. This is because the group paid for some things in USD when they were on a trip.

What I did was make my code keep track of the currency for each expense. I do not automatically convert the currency to INR.

This problem affected 4 rows.

### 2.5 The paid_by field is empty sometimes

One of the rows does not have anyone listed as the person who paid. The note for that row says that the person cannot remember who paid.

What I did was make my code show an error when it imports this row. The user has to fill in the paid_by field or skip this row.

### 2.6 Names do not match exactly

One of the rows has a name listed as `priya`. The actual name of the person is `Priya`.

What I did was make my code not care about whether the name's written in uppercase or lowercase letters.

### 2.7 Two people have the same name

There are two people in the group named Priya. One of them has the name S but the other one does not.

What I did was make my code match the name to the person based on what it finds. If the user wants to change this they can.

### 2.8 Names have extra words

One of the rows has a name listed as `Dev's friend Kabir`. The actual name of the person is `Kabir`.

What I did was make my code look for the name inside the extra words.

### 2.9 Negative amounts

One of the rows has an amount because the person got a refund.

What I did was make my code allow amounts but I also show a warning to the user. The user can decide what to do with the amount.

### 2.10 Zero amounts

One of the rows has an amount of zero. The note for that row says that it was counted earlier and the person is fixing it later.

What I did was make my code not import rows with zero amounts.

### 2.11 Percentages that do not add up to 100%

One of the rows has percentages that add up to more than 100%.

What I did was make my code change the percentages so they add up to 100%.

### 2.12 Equal split but shares are written anyway

One of the rows has an equal split but the shares are still written.

What I did was make my code ignore the shares when the split is equal.

### 2.13 Split type is empty

One of the rows does not have a type listed.

What I did was make my code detect if the row's a settlement or an expense. If it is a settlement I create a Settlement record of an Expense record.

### 2.14 Settlements are mixed in with expenses

Some of the rows are actually settlements, not expenses.

What I did was make my code detect settlements and create a Settlement record of an Expense record.

### 2.15 Duplicates within the CSV

Some of the rows are duplicates.

What I did was make my code flag the duplicates. I do not automatically remove them. The user has to decide what to do with the duplicates.

### 2.16 Duplicates with existing expenses in the database

Some of the rows are duplicates of expenses that are already in the database.

What I did was make my code flag the duplicates with a warning. I do not automatically remove them.

### 2.17 Someone who is not a member anymore is still in the splits

One of the people in the group left. They are still listed in some of the rows.

What I did was make my code check if the person was a member at the time of the expense. If they were not I show an error and the user has to remove them from the split.

### 2.18 Members who joined late are charged from day one

One of the people in the group joined late. They are still being charged for expenses from before they joined.

What I did was make my code check if the person was a member at the time of the expense. If they were not I do not charge them for that expense.

### 2.19 Currency is INR but the trip was in Goa with USD expenses

The group's default currency is INR but some of the expenses are in USD.

What I did was make my code keep track of the currency for each expense. I do not automatically convert the currency to INR.

### 2.20 Numbers have commas in them

One of the rows has a number with a comma in it.

What I did was make my code remove the comma before it tries to understand the number.

### 2.21 Whitespace around amounts

One of the rows has whitespace around the amount.

What I did was make my code remove the whitespace before it tries to understand the amount.

### 2.22 Equal split with one person

One of the rows has an equal split but there is only one person listed.

What I did was make my code treat it as a settlement if there is no type and the description matches settlement words.

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
