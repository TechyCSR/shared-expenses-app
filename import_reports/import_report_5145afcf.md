# Import Report

- **File:** `import_20260615_104140.csv`
- **Job ID:** `5145afcf-677b-46ba-829b-ccadf3d1d404`
- **Status:** completed
- **Created:** 2026-06-15T10:41:40.166466+00:00
- **Completed:** 2026-06-15T10:41:57.084975+00:00

> ⚠️ **28 rows imported, 14 rows skipped**

## Summary

| Metric | Count |
|--------|------:|
| Total rows in CSV | 42 |
| Imported successfully | **28** |
| Rejected | 14 |
| Anomalies detected (error / warning / info) | 54 / 52 / 0 |
| User decisions (approve / reject / unresolved) | 106 / 0 / 0 |

## Anomalies Detected (Grouped)

Identical anomalies are grouped together. Expand the detailed breakdown below for row-by-row info.

| # | Count | Type | Severity | Message | Decisions (A/R/U) |
|---|------:|------|----------|---------|-------------------|
| 1 | **32** | `duplicate_expense` | **WARNING** | Row 1: Similar to existing expense 'February rent' (48000.0000) | 32/0/0 |
| _Rows: 1, 2, 3, 6, 8, 9, 10, 11, 12, 13, ... (+22 more)_ | | | | | |
| 2 | **20** | `unknown_participant` | **ERROR** | Row 1: Participant 'Meera' does not match any group member | 20/0/0 |
| _Rows: 1, 2, 3, 6, 7, 9, 10, 11, 12, 14, ... (+10 more)_ | | | | | |
| 3 | **12** | `unknown_participant` | **ERROR** | Row 4: Payer 'Dev' does not match any group member | 12/0/0 |
| _Rows: 4, 5, 7, 16, 19, 22, 25, 29, 31, 37, ... (+2 more)_ | | | | | |
| 4 | **11** | `unknown_participant` | **ERROR** | Row 4: Participant 'Dev' does not match any group member | 11/0/0 |
| _Rows: 4, 5, 18, 19, 20, 21, 22, 23, 24, 25, ... (+1 more)_ | | | | | |
| 5 | **5** | `unknown_participant` | **ERROR** | Row 38: Participant 'Sam' does not match any group member | 5/0/0 |
| _Rows: 38, 39, 40, 41, 42_ | | | | | |
| 6 | **4** | `currency_mismatch_group` | **WARNING** | Row 19: Currency 'USD' differs from group default 'INR' | 4/0/0 |
| _Rows: 19, 20, 22, 25_ | | | | | |
| 7 | **3** | `ambiguous_date` | **WARNING** | Row 22: Date '11/03/2026' is ambiguous (DD/MM vs MM/DD) | 3/0/0 |
| _Rows: 22, 23, 24_ | | | | | |
| 8 | **2** | `invalid_percentages` | **ERROR** | Row 14: Percentages sum to 110%, must be 100% | 2/0/0 |
| _Rows: 14, 31_ | | | | | |
| 9 | **2** | `settlement_as_expense` | **WARNING** | Row 13: 'Rohan paid Aisha back' looks like a settlement, not an expense | 2/0/0 |
| _Rows: 13, 37_ | | | | | |
| 10 | **2** | `ambiguous_date` | **WARNING** | Row 20: Date '10/03/2026' is ambiguous (DD/MM vs MM/DD) | 2/0/0 |
| _Rows: 20, 21_ | | | | | |
| 11 | **1** | `missing_payer` | **ERROR** | Row 12: Payer (paid_by) is empty | 1/0/0 |
| _Rows: 12_ | | | | | |
| 12 | **1** | `invalid_split_type` | **ERROR** | Row 13: Split type is empty | 1/0/0 |
| _Rows: 13_ | | | | | |
| 13 | **1** | `unknown_participant` | **ERROR** | Row 22: Participant 'Dev's friend Kabir' does not match any group member | 1/0/0 |
| _Rows: 22_ | | | | | |
| 14 | **1** | `invalid_currency` | **ERROR** | Row 27: Currency is empty | 1/0/0 |
| _Rows: 27_ | | | | | |
| 15 | **1** | `ambiguous_date` | **WARNING** | Row 15: Date '01/03/2026' is ambiguous (DD/MM vs MM/DD) | 1/0/0 |
| _Rows: 15_ | | | | | |
| 16 | **1** | `ambiguous_date` | **WARNING** | Row 17: Date '05/03/2026' is ambiguous (DD/MM vs MM/DD) | 1/0/0 |
| _Rows: 17_ | | | | | |
| 17 | **1** | `ambiguous_date` | **WARNING** | Row 18: Date '08/03/2026' is ambiguous (DD/MM vs MM/DD) | 1/0/0 |
| _Rows: 18_ | | | | | |
| 18 | **1** | `ambiguous_date` | **WARNING** | Row 19: Date '09/03/2026' is ambiguous (DD/MM vs MM/DD) | 1/0/0 |
| _Rows: 19_ | | | | | |
| 19 | **1** | `negative_amount` | **WARNING** | Row 25: Amount is negative (-30) - possible refund | 1/0/0 |
| _Rows: 25_ | | | | | |
| 20 | **1** | `ambiguous_date` | **WARNING** | Row 25: Date '12/03/2026' is ambiguous (DD/MM vs MM/DD) | 1/0/0 |
| _Rows: 25_ | | | | | |
| 21 | **1** | `zero_amount` | **WARNING** | Row 30: Amount is zero | 1/0/0 |
| _Rows: 30_ | | | | | |
| 22 | **1** | `ambiguous_date` | **WARNING** | Row 33: Date '04/05/2026' is ambiguous (DD/MM vs MM/DD) | 1/0/0 |
| _Rows: 33_ | | | | | |
| 23 | **1** | `split_details_format_mismatch` | **WARNING** | Row 41: Split type is 'equal' but split_details contain values | 1/0/0 |
| _Rows: 41_ | | | | | |

## Detailed Anomaly Breakdown

### 1. duplicate_expense (32 occurrences)

- **Severity:** warning
- **Message:** Row 1: Similar to existing expense 'February rent' (48000.0000)
- **Affected rows:** 1, 2, 3, 6, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 20, 21, 23, 24, 26, 27, 28, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42
- **Decisions:** approved=32, rejected=0, unresolved=0

### 2. unknown_participant (20 occurrences)

- **Key value:** `Meera`

- **Severity:** error
- **Message:** Row 1: Participant 'Meera' does not match any group member
- **Affected rows:** 1, 2, 3, 6, 7, 9, 10, 11, 12, 14, 15, 16, 17, 27, 28, 29, 30, 31, 32, 35
- **Decisions:** approved=20, rejected=0, unresolved=0

### 3. unknown_participant (12 occurrences)

- **Severity:** error
- **Message:** Row 4: Payer 'Dev' does not match any group member
- **Affected rows:** 4, 5, 7, 16, 19, 22, 25, 29, 31, 37, 38, 40
- **Decisions:** approved=12, rejected=0, unresolved=0

### 4. unknown_participant (11 occurrences)

- **Key value:** `Dev`

- **Severity:** error
- **Message:** Row 4: Participant 'Dev' does not match any group member
- **Affected rows:** 4, 5, 18, 19, 20, 21, 22, 23, 24, 25, 26
- **Decisions:** approved=11, rejected=0, unresolved=0

### 5. unknown_participant (5 occurrences)

- **Key value:** `Sam`

- **Severity:** error
- **Message:** Row 38: Participant 'Sam' does not match any group member
- **Affected rows:** 38, 39, 40, 41, 42
- **Decisions:** approved=5, rejected=0, unresolved=0

### 6. currency_mismatch_group (4 occurrences)

- **Key value:** `USD`

- **Severity:** warning
- **Message:** Row 19: Currency 'USD' differs from group default 'INR'
- **Affected rows:** 19, 20, 22, 25
- **Decisions:** approved=4, rejected=0, unresolved=0

### 7. ambiguous_date (3 occurrences)

- **Key value:** `11/03/2026`

- **Severity:** warning
- **Message:** Row 22: Date '11/03/2026' is ambiguous (DD/MM vs MM/DD)
- **Affected rows:** 22, 23, 24
- **Decisions:** approved=3, rejected=0, unresolved=0

### 8. invalid_percentages (2 occurrences)

- **Severity:** error
- **Message:** Row 14: Percentages sum to 110%, must be 100%
- **Affected rows:** 14, 31
- **Decisions:** approved=2, rejected=0, unresolved=0

### 9. settlement_as_expense (2 occurrences)

- **Severity:** warning
- **Message:** Row 13: 'Rohan paid Aisha back' looks like a settlement, not an expense
- **Affected rows:** 13, 37
- **Decisions:** approved=2, rejected=0, unresolved=0

### 10. ambiguous_date (2 occurrences)

- **Key value:** `10/03/2026`

- **Severity:** warning
- **Message:** Row 20: Date '10/03/2026' is ambiguous (DD/MM vs MM/DD)
- **Affected rows:** 20, 21
- **Decisions:** approved=2, rejected=0, unresolved=0

### 11. missing_payer (1 occurrence)

- **Severity:** error
- **Message:** Row 12: Payer (paid_by) is empty
- **Affected rows:** 12
- **Decisions:** approved=1, rejected=0, unresolved=0

### 12. invalid_split_type (1 occurrence)

- **Severity:** error
- **Message:** Row 13: Split type is empty
- **Affected rows:** 13
- **Decisions:** approved=1, rejected=0, unresolved=0

### 13. unknown_participant (1 occurrence)

- **Key value:** `Dev's friend Kabir`

- **Severity:** error
- **Message:** Row 22: Participant 'Dev's friend Kabir' does not match any group member
- **Affected rows:** 22
- **Decisions:** approved=1, rejected=0, unresolved=0

### 14. invalid_currency (1 occurrence)

- **Key value:** `INR`

- **Severity:** error
- **Message:** Row 27: Currency is empty
- **Affected rows:** 27
- **Decisions:** approved=1, rejected=0, unresolved=0

### 15. ambiguous_date (1 occurrence)

- **Key value:** `01/03/2026`

- **Severity:** warning
- **Message:** Row 15: Date '01/03/2026' is ambiguous (DD/MM vs MM/DD)
- **Affected rows:** 15
- **Decisions:** approved=1, rejected=0, unresolved=0

### 16. ambiguous_date (1 occurrence)

- **Key value:** `05/03/2026`

- **Severity:** warning
- **Message:** Row 17: Date '05/03/2026' is ambiguous (DD/MM vs MM/DD)
- **Affected rows:** 17
- **Decisions:** approved=1, rejected=0, unresolved=0

### 17. ambiguous_date (1 occurrence)

- **Key value:** `08/03/2026`

- **Severity:** warning
- **Message:** Row 18: Date '08/03/2026' is ambiguous (DD/MM vs MM/DD)
- **Affected rows:** 18
- **Decisions:** approved=1, rejected=0, unresolved=0

### 18. ambiguous_date (1 occurrence)

- **Key value:** `09/03/2026`

- **Severity:** warning
- **Message:** Row 19: Date '09/03/2026' is ambiguous (DD/MM vs MM/DD)
- **Affected rows:** 19
- **Decisions:** approved=1, rejected=0, unresolved=0

### 19. negative_amount (1 occurrence)

- **Severity:** warning
- **Message:** Row 25: Amount is negative (-30) - possible refund
- **Affected rows:** 25
- **Decisions:** approved=1, rejected=0, unresolved=0

### 20. ambiguous_date (1 occurrence)

- **Key value:** `12/03/2026`

- **Severity:** warning
- **Message:** Row 25: Date '12/03/2026' is ambiguous (DD/MM vs MM/DD)
- **Affected rows:** 25
- **Decisions:** approved=1, rejected=0, unresolved=0

### 21. zero_amount (1 occurrence)

- **Severity:** warning
- **Message:** Row 30: Amount is zero
- **Affected rows:** 30
- **Decisions:** approved=1, rejected=0, unresolved=0

### 22. ambiguous_date (1 occurrence)

- **Key value:** `04/05/2026`

- **Severity:** warning
- **Message:** Row 33: Date '04/05/2026' is ambiguous (DD/MM vs MM/DD)
- **Affected rows:** 33
- **Decisions:** approved=1, rejected=0, unresolved=0

### 23. split_details_format_mismatch (1 occurrence)

- **Severity:** warning
- **Message:** Row 41: Split type is 'equal' but split_details contain values
- **Affected rows:** 41
- **Decisions:** approved=1, rejected=0, unresolved=0

## Rejected Rows

| Row | Reason | Description |
|----:|--------|-------------|
| 4 | `no_matching_payer` | Dinner at Marina Bites |
| 5 | `no_matching_payer` | dinner - marina bites |
| 7 | `no_matching_payer` | Maid salary Feb |
| 12 | `missing_payer` | House cleaning supplies |
| 16 | `no_matching_payer` | Groceries BigBasket |
| 19 | `no_matching_payer` | Goa villa booking |
| 22 | `no_matching_payer` | Parasailing |
| 25 | `no_matching_payer` | Parasailing refund |
| 29 | `no_matching_payer` | Maid salary Mar |
| 30 | `zero_amount` | Dinner order Swiggy |
| 31 | `no_matching_payer` | Weekend brunch |
| 37 | `no_matching_payer` | Sam deposit share |
| 38 | `no_matching_payer` | Housewarming drinks |
| 40 | `no_matching_payer` | Groceries DMart |

## Anomaly Handling Policy

Default behaviour for each anomaly type:

| Type | Default Action | Reason |
|------|----------------|--------|
| `zero_amount` | skip | Zero-amount expenses are placeholders, not real expenses |
| `missing_payer` | skip | Cannot record expense without knowing who paid — row is dropped |
| `ambiguous_date` | assume dd mm yyyy | Indian context (INR currency) — DD/MM is the local convention |
| `negative_amount` | convert to settlement | Negative amounts are typically refunds/payments back — convert to settlement |
| `invalid_currency` | use group default | Use the group's default currency (INR) when currency field is empty |
| `invalid_split_type` | use equal | Treat as equal split when split type is missing or unknown |
| `invalid_percentages` | normalize to 100 | If percentages sum to 110%, scale each proportionally so they sum to 100% |
| `name_fuzzy_mismatch` | approve if correct | Fuzzy match is best-effort; user must confirm the mapping is correct |
| `unknown_participant` | approve only if mapped | User must explicitly map the name to a real group member, or the row is dropped |
| `duplicate_within_csv` | keep both | Cannot determine which is authoritative — keep both rows (reviewer should manually dedupe) |
| `settlement_as_expense` | convert to settlement | Detected as settlement by keywords ('paid back', 'deposit share') — convert to settlement record |
| `currency_mismatch_group` | keep original | USD expenses stay in USD; group currency is for display only |
| `duplicate_with_existing` | keep both | Similar expense already exists in group — keep both; reviewer should manually reconcile |
| `member_not_active_on_date` | include anyway | User wasn't a member on the expense date — exclude from participants, but keep expense |
| `split_details_format_mismatch` | use split type | If split_type is 'equal' but details provided, ignore details and use equal split |

## Final Counts

- Total rows: `42`
- Imported: `28`
- Rejected: `14`

### Anomalies by Type

- `zero_amount`: 1
- `missing_payer`: 1
- `ambiguous_date`: 11
- `negative_amount`: 1
- `invalid_currency`: 1
- `duplicate_expense`: 32
- `invalid_split_type`: 1
- `invalid_percentages`: 2
- `unknown_participant`: 49
- `settlement_as_expense`: 2
- `currency_mismatch_group`: 4
- `split_details_format_mismatch`: 1

### Actions by Decision

- `approve`: 106

---

_Report generated at 2026-06-15T10:42:34.505435_
