# Import Report

- **File:** `import_20260615_021926.csv`
- **Job ID:** `0aed8609-c93a-4141-8fef-f20e92496383`
- **Status:** completed
- **Created:** 2026-06-15T02:19:26.172334+00:00
- **Completed:** 2026-06-15T02:21:10.319669+00:00

## Summary

| Metric | Count |
|--------|------:|
| Total rows in CSV | 42 |
| Imported successfully | **32** |
| Rejected | 10 |
| Anomalies detected (error / warning / info) | 54 / 20 / 0 |
| User decisions (approve / reject / unresolved) | 74 / 0 / 0 |

## Anomalies Detected

| # | Row | Type | Severity | Message | Action Taken |
|---|----:|------|----------|---------|--------------|
| 1 | 1 | `unknown_participant` | **ERROR** | Row 1: Participant 'Meera' does not match any group member | APPROVE |
| 2 | 2 | `unknown_participant` | **ERROR** | Row 2: Participant 'Meera' does not match any group member | APPROVE |
| 3 | 3 | `unknown_participant` | **ERROR** | Row 3: Participant 'Meera' does not match any group member | APPROVE |
| 4 | 4 | `unknown_participant` | **ERROR** | Row 4: Payer 'Dev' does not match any group member | APPROVE |
| 5 | 4 | `unknown_participant` | **ERROR** | Row 4: Participant 'Dev' does not match any group member | APPROVE |
| 6 | 5 | `unknown_participant` | **ERROR** | Row 5: Payer 'Dev' does not match any group member | APPROVE |
| 7 | 5 | `unknown_participant` | **ERROR** | Row 5: Participant 'Dev' does not match any group member | APPROVE |
| 8 | 6 | `unknown_participant` | **ERROR** | Row 6: Participant 'Meera' does not match any group member | APPROVE |
| 9 | 7 | `unknown_participant` | **ERROR** | Row 7: Participant 'Meera' does not match any group member | APPROVE |
| 10 | 7 | `unknown_participant` | **ERROR** | Row 7: Payer 'Meera' does not match any group member | APPROVE |
| 11 | 9 | `unknown_participant` | **ERROR** | Row 9: Participant 'Meera' does not match any group member | APPROVE |
| 12 | 10 | `unknown_participant` | **ERROR** | Row 10: Participant 'Meera' does not match any group member | APPROVE |
| 13 | 11 | `unknown_participant` | **ERROR** | Row 11: Participant 'Meera' does not match any group member | APPROVE |
| 14 | 12 | `missing_payer` | **ERROR** | Row 12: Payer (paid_by) is empty | APPROVE |
| 15 | 12 | `unknown_participant` | **ERROR** | Row 12: Participant 'Meera' does not match any group member | APPROVE |
| 16 | 13 | `invalid_split_type` | **ERROR** | Row 13: Split type is empty | APPROVE |
| 17 | 13 | `settlement_as_expense` | **WARNING** | Row 13: 'Rohan paid Aisha back' looks like a settlement, not an expense | APPROVE |
| 18 | 14 | `invalid_percentages` | **ERROR** | Row 14: Percentages sum to 110%, must be 100% | APPROVE |
| 19 | 14 | `unknown_participant` | **ERROR** | Row 14: Participant 'Meera' does not match any group member | APPROVE |
| 20 | 15 | `unknown_participant` | **ERROR** | Row 15: Participant 'Meera' does not match any group member | APPROVE |
| 21 | 15 | `ambiguous_date` | **WARNING** | Row 15: Date '01/03/2026' is ambiguous (DD/MM vs MM/DD) | APPROVE |
| 22 | 16 | `unknown_participant` | **ERROR** | Row 16: Participant 'Meera' does not match any group member | APPROVE |
| 23 | 16 | `unknown_participant` | **ERROR** | Row 16: Payer 'Meera' does not match any group member | APPROVE |
| 24 | 17 | `unknown_participant` | **ERROR** | Row 17: Participant 'Meera' does not match any group member | APPROVE |
| 25 | 17 | `ambiguous_date` | **WARNING** | Row 17: Date '05/03/2026' is ambiguous (DD/MM vs MM/DD) | APPROVE |
| 26 | 18 | `unknown_participant` | **ERROR** | Row 18: Participant 'Dev' does not match any group member | APPROVE |
| 27 | 18 | `ambiguous_date` | **WARNING** | Row 18: Date '08/03/2026' is ambiguous (DD/MM vs MM/DD) | APPROVE |
| 28 | 19 | `unknown_participant` | **ERROR** | Row 19: Payer 'Dev' does not match any group member | APPROVE |
| 29 | 19 | `unknown_participant` | **ERROR** | Row 19: Participant 'Dev' does not match any group member | APPROVE |
| 30 | 19 | `currency_mismatch_group` | **WARNING** | Row 19: Currency 'USD' differs from group default 'INR' | APPROVE |
| 31 | 19 | `ambiguous_date` | **WARNING** | Row 19: Date '09/03/2026' is ambiguous (DD/MM vs MM/DD) | APPROVE |
| 32 | 20 | `unknown_participant` | **ERROR** | Row 20: Participant 'Dev' does not match any group member | APPROVE |
| 33 | 20 | `currency_mismatch_group` | **WARNING** | Row 20: Currency 'USD' differs from group default 'INR' | APPROVE |
| 34 | 20 | `ambiguous_date` | **WARNING** | Row 20: Date '10/03/2026' is ambiguous (DD/MM vs MM/DD) | APPROVE |
| 35 | 21 | `unknown_participant` | **ERROR** | Row 21: Participant 'Dev' does not match any group member | APPROVE |
| 36 | 21 | `ambiguous_date` | **WARNING** | Row 21: Date '10/03/2026' is ambiguous (DD/MM vs MM/DD) | APPROVE |
| 37 | 22 | `unknown_participant` | **ERROR** | Row 22: Participant 'Dev' does not match any group member | APPROVE |
| 38 | 22 | `unknown_participant` | **ERROR** | Row 22: Participant 'Dev's friend Kabir' does not match any group member | APPROVE |
| 39 | 22 | `unknown_participant` | **ERROR** | Row 22: Payer 'Dev' does not match any group member | APPROVE |
| 40 | 22 | `ambiguous_date` | **WARNING** | Row 22: Date '11/03/2026' is ambiguous (DD/MM vs MM/DD) | APPROVE |
| 41 | 22 | `currency_mismatch_group` | **WARNING** | Row 22: Currency 'USD' differs from group default 'INR' | APPROVE |
| 42 | 23 | `unknown_participant` | **ERROR** | Row 23: Participant 'Dev' does not match any group member | APPROVE |
| 43 | 23 | `ambiguous_date` | **WARNING** | Row 23: Date '11/03/2026' is ambiguous (DD/MM vs MM/DD) | APPROVE |
| 44 | 24 | `unknown_participant` | **ERROR** | Row 24: Participant 'Dev' does not match any group member | APPROVE |
| 45 | 24 | `ambiguous_date` | **WARNING** | Row 24: Date '11/03/2026' is ambiguous (DD/MM vs MM/DD) | APPROVE |
| 46 | 25 | `unknown_participant` | **ERROR** | Row 25: Payer 'Dev' does not match any group member | APPROVE |
| 47 | 25 | `unknown_participant` | **ERROR** | Row 25: Participant 'Dev' does not match any group member | APPROVE |
| 48 | 25 | `ambiguous_date` | **WARNING** | Row 25: Date '12/03/2026' is ambiguous (DD/MM vs MM/DD) | APPROVE |
| 49 | 25 | `negative_amount` | **WARNING** | Row 25: Amount is negative (-30) - possible refund | APPROVE |
| 50 | 25 | `currency_mismatch_group` | **WARNING** | Row 25: Currency 'USD' differs from group default 'INR' | APPROVE |
| 51 | 26 | `unknown_participant` | **ERROR** | Row 26: Participant 'Dev' does not match any group member | APPROVE |
| 52 | 27 | `invalid_currency` | **ERROR** | Row 27: Currency is empty | APPROVE |
| 53 | 27 | `unknown_participant` | **ERROR** | Row 27: Participant 'Meera' does not match any group member | APPROVE |
| 54 | 28 | `unknown_participant` | **ERROR** | Row 28: Participant 'Meera' does not match any group member | APPROVE |
| 55 | 29 | `unknown_participant` | **ERROR** | Row 29: Participant 'Meera' does not match any group member | APPROVE |
| 56 | 29 | `unknown_participant` | **ERROR** | Row 29: Payer 'Meera' does not match any group member | APPROVE |
| 57 | 30 | `unknown_participant` | **ERROR** | Row 30: Participant 'Meera' does not match any group member | APPROVE |
| 58 | 30 | `zero_amount` | **WARNING** | Row 30: Amount is zero | APPROVE |
| 59 | 31 | `unknown_participant` | **ERROR** | Row 31: Participant 'Meera' does not match any group member | APPROVE |
| 60 | 31 | `unknown_participant` | **ERROR** | Row 31: Payer 'Meera' does not match any group member | APPROVE |
| 61 | 31 | `invalid_percentages` | **ERROR** | Row 31: Percentages sum to 110%, must be 100% | APPROVE |
| 62 | 32 | `unknown_participant` | **ERROR** | Row 32: Participant 'Meera' does not match any group member | APPROVE |
| 63 | 33 | `ambiguous_date` | **WARNING** | Row 33: Date '04/05/2026' is ambiguous (DD/MM vs MM/DD) | APPROVE |
| 64 | 35 | `unknown_participant` | **ERROR** | Row 35: Participant 'Meera' does not match any group member | APPROVE |
| 65 | 37 | `unknown_participant` | **ERROR** | Row 37: Payer 'Sam' does not match any group member | APPROVE |
| 66 | 37 | `settlement_as_expense` | **WARNING** | Row 37: 'Sam deposit share' looks like a settlement, not an expense | APPROVE |
| 67 | 38 | `unknown_participant` | **ERROR** | Row 38: Payer 'Sam' does not match any group member | APPROVE |
| 68 | 38 | `unknown_participant` | **ERROR** | Row 38: Participant 'Sam' does not match any group member | APPROVE |
| 69 | 39 | `unknown_participant` | **ERROR** | Row 39: Participant 'Sam' does not match any group member | APPROVE |
| 70 | 40 | `unknown_participant` | **ERROR** | Row 40: Payer 'Sam' does not match any group member | APPROVE |
| 71 | 40 | `unknown_participant` | **ERROR** | Row 40: Participant 'Sam' does not match any group member | APPROVE |
| 72 | 41 | `unknown_participant` | **ERROR** | Row 41: Participant 'Sam' does not match any group member | APPROVE |
| 73 | 41 | `split_details_format_mismatch` | **WARNING** | Row 41: Split type is 'equal' but split_details contain values | APPROVE |
| 74 | 42 | `unknown_participant` | **ERROR** | Row 42: Participant 'Sam' does not match any group member | APPROVE |

## Detailed Anomaly Breakdown

### 1. Row 1 — unknown_participant

- **Severity:** error
- **Message:** Row 1: Participant 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-02-01 |
  | notes |  |
  | amount | 48000 |
  | paid_by | Aisha |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | February rent |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Meera'}
  ```

### 2. Row 2 — unknown_participant

- **Severity:** error
- **Message:** Row 2: Participant 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-02-03 |
  | notes |  |
  | amount | 2340 |
  | paid_by | Priya |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Groceries BigBasket |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Meera'}
  ```

### 3. Row 3 — unknown_participant

- **Severity:** error
- **Message:** Row 3: Participant 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-02-05 |
  | notes |  |
  | amount | 1199 |
  | paid_by | Rohan |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Wifi bill Feb |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Meera'}
  ```

### 4. Row 4 — unknown_participant

- **Severity:** error
- **Message:** Row 4: Payer 'Dev' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-02-08 |
  | notes | Dev visiting for the weekend |
  | amount | 3200 |
  | paid_by | Dev |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | Dinner at Marina Bites |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_payer', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S']}
  ```

### 5. Row 4 — unknown_participant

- **Severity:** error
- **Message:** Row 4: Participant 'Dev' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-02-08 |
  | notes | Dev visiting for the weekend |
  | amount | 3200 |
  | paid_by | Dev |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | Dinner at Marina Bites |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Dev'}
  ```

### 6. Row 5 — unknown_participant

- **Severity:** error
- **Message:** Row 5: Payer 'Dev' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-02-08 |
  | notes |  |
  | amount | 3200 |
  | paid_by | Dev |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | dinner - marina bites |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_payer', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S']}
  ```

### 7. Row 5 — unknown_participant

- **Severity:** error
- **Message:** Row 5: Participant 'Dev' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-02-08 |
  | notes |  |
  | amount | 3200 |
  | paid_by | Dev |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | dinner - marina bites |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Dev'}
  ```

### 8. Row 6 — unknown_participant

- **Severity:** error
- **Message:** Row 6: Participant 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-02-10 |
  | notes |  |
  | amount | 1,200 |
  | paid_by | Aisha |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Electricity Feb |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Meera'}
  ```

### 9. Row 7 — unknown_participant

- **Severity:** error
- **Message:** Row 7: Participant 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-02-12 |
  | notes |  |
  | amount | 3000 |
  | paid_by | Meera |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Maid salary Feb |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Meera'}
  ```

### 10. Row 7 — unknown_participant

- **Severity:** error
- **Message:** Row 7: Payer 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-02-12 |
  | notes |  |
  | amount | 3000 |
  | paid_by | Meera |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Maid salary Feb |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_payer', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S']}
  ```

### 11. Row 9 — unknown_participant

- **Severity:** error
- **Message:** Row 9: Participant 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-02-15 |
  | notes |  |
  | amount | 899.995 |
  | paid_by | Rohan |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Cylinder refill |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Meera'}
  ```

### 12. Row 10 — unknown_participant

- **Severity:** error
- **Message:** Row 10: Participant 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-02-18 |
  | notes |  |
  | amount | 1875 |
  | paid_by | Priya S |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Groceries DMart |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Meera'}
  ```

### 13. Row 11 — unknown_participant

- **Severity:** error
- **Message:** Row 11: Participant 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-02-20 |
  | notes | Aisha not charged obviously |
  | amount | 1500 |
  | paid_by | Rohan |
  | currency | INR |
  | split_type | unequal |
  | split_with | Rohan;Priya;Meera |
  | description | Aisha birthday cake |
  | split_details | Rohan 700; Priya 400; Meera 400 |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Meera'}
  ```

### 14. Row 12 — missing_payer

- **Severity:** error
- **Message:** Row 12: Payer (paid_by) is empty
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-02-22 |
  | notes | can't remember who paid |
  | amount | 780 |
  | paid_by |  |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | House cleaning supplies |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_payer', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S']}
  ```

### 15. Row 12 — unknown_participant

- **Severity:** error
- **Message:** Row 12: Participant 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-02-22 |
  | notes | can't remember who paid |
  | amount | 780 |
  | paid_by |  |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | House cleaning supplies |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Meera'}
  ```

### 16. Row 13 — invalid_split_type

- **Severity:** error
- **Message:** Row 13: Split type is empty
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-02-25 |
  | notes | this is a settlement not an expense?? |
  | amount | 5000 |
  | paid_by | Rohan |
  | currency | INR |
  | split_type |  |
  | split_with | Aisha |
  | description | Rohan paid Aisha back |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_split_type', 'options': ['equal', 'unequal', 'percentage', 'share', 'shares']}
  ```

### 17. Row 13 — settlement_as_expense

- **Severity:** warning
- **Message:** Row 13: 'Rohan paid Aisha back' looks like a settlement, not an expense
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-02-25 |
  | notes | this is a settlement not an expense?? |
  | amount | 5000 |
  | paid_by | Rohan |
  | currency | INR |
  | split_type |  |
  | split_with | Aisha |
  | description | Rohan paid Aisha back |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'convert_to_settlement_or_keep', 'options': ['keep_as_expense', 'convert_to_settlement', 'reject']}
  ```

### 18. Row 14 — invalid_percentages

- **Severity:** error
- **Message:** Row 14: Percentages sum to 110%, must be 100%
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-02-28 |
  | notes | percentages might be off |
  | amount | 1440 |
  | paid_by | Aisha |
  | currency | INR |
  | split_type | percentage |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Pizza Friday |
  | split_details | Aisha 30%; Rohan 30%; Priya 30%; Meera 20% |
- **Suggested action:**

  ```json
  {'type': 'normalize_or_reject'}
  ```

### 19. Row 14 — unknown_participant

- **Severity:** error
- **Message:** Row 14: Participant 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-02-28 |
  | notes | percentages might be off |
  | amount | 1440 |
  | paid_by | Aisha |
  | currency | INR |
  | split_type | percentage |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Pizza Friday |
  | split_details | Aisha 30%; Rohan 30%; Priya 30%; Meera 20% |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Meera'}
  ```

### 20. Row 15 — unknown_participant

- **Severity:** error
- **Message:** Row 15: Participant 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 01/03/2026 |
  | notes |  |
  | amount | 48000 |
  | paid_by | Aisha |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | March rent |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Meera'}
  ```

### 21. Row 15 — ambiguous_date

- **Severity:** warning
- **Message:** Row 15: Date '01/03/2026' is ambiguous (DD/MM vs MM/DD)
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 01/03/2026 |
  | notes |  |
  | amount | 48000 |
  | paid_by | Aisha |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | March rent |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_format', 'options': ['dd_mm_yyyy', 'mm_dd_yyyy'], 'raw_value': '01/03/2026'}
  ```

### 22. Row 16 — unknown_participant

- **Severity:** error
- **Message:** Row 16: Participant 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 03/03/2026 |
  | notes |  |
  | amount | 2810 |
  | paid_by | Meera |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Groceries BigBasket |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Meera'}
  ```

### 23. Row 16 — unknown_participant

- **Severity:** error
- **Message:** Row 16: Payer 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 03/03/2026 |
  | notes |  |
  | amount | 2810 |
  | paid_by | Meera |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Groceries BigBasket |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_payer', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S']}
  ```

### 24. Row 17 — unknown_participant

- **Severity:** error
- **Message:** Row 17: Participant 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 05/03/2026 |
  | notes |  |
  | amount | 1199 |
  | paid_by | Rohan |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Wifi bill Mar |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Meera'}
  ```

### 25. Row 17 — ambiguous_date

- **Severity:** warning
- **Message:** Row 17: Date '05/03/2026' is ambiguous (DD/MM vs MM/DD)
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 05/03/2026 |
  | notes |  |
  | amount | 1199 |
  | paid_by | Rohan |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Wifi bill Mar |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_format', 'options': ['dd_mm_yyyy', 'mm_dd_yyyy'], 'raw_value': '05/03/2026'}
  ```

### 26. Row 18 — unknown_participant

- **Severity:** error
- **Message:** Row 18: Participant 'Dev' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 08/03/2026 |
  | notes | trip starts! |
  | amount | 32400 |
  | paid_by | Aisha |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | Goa flights |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Dev'}
  ```

### 27. Row 18 — ambiguous_date

- **Severity:** warning
- **Message:** Row 18: Date '08/03/2026' is ambiguous (DD/MM vs MM/DD)
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 08/03/2026 |
  | notes | trip starts! |
  | amount | 32400 |
  | paid_by | Aisha |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | Goa flights |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_format', 'options': ['dd_mm_yyyy', 'mm_dd_yyyy'], 'raw_value': '08/03/2026'}
  ```

### 28. Row 19 — unknown_participant

- **Severity:** error
- **Message:** Row 19: Payer 'Dev' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 09/03/2026 |
  | notes | booked on intl site |
  | amount | 540 |
  | paid_by | Dev |
  | currency | USD |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | Goa villa booking |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_payer', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S']}
  ```

### 29. Row 19 — unknown_participant

- **Severity:** error
- **Message:** Row 19: Participant 'Dev' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 09/03/2026 |
  | notes | booked on intl site |
  | amount | 540 |
  | paid_by | Dev |
  | currency | USD |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | Goa villa booking |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Dev'}
  ```

### 30. Row 19 — currency_mismatch_group

- **Severity:** warning
- **Message:** Row 19: Currency 'USD' differs from group default 'INR'
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 09/03/2026 |
  | notes | booked on intl site |
  | amount | 540 |
  | paid_by | Dev |
  | currency | USD |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | Goa villa booking |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'keep_or_convert', 'default': 'INR', 'options': ['keep_currency', 'convert_to_group_default'], 'raw_value': 'USD'}
  ```

### 31. Row 19 — ambiguous_date

- **Severity:** warning
- **Message:** Row 19: Date '09/03/2026' is ambiguous (DD/MM vs MM/DD)
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 09/03/2026 |
  | notes | booked on intl site |
  | amount | 540 |
  | paid_by | Dev |
  | currency | USD |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | Goa villa booking |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_format', 'options': ['dd_mm_yyyy', 'mm_dd_yyyy'], 'raw_value': '09/03/2026'}
  ```

### 32. Row 20 — unknown_participant

- **Severity:** error
- **Message:** Row 20: Participant 'Dev' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 10/03/2026 |
  | notes |  |
  | amount | 84 |
  | paid_by | Rohan |
  | currency | USD |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | Beach shack lunch |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Dev'}
  ```

### 33. Row 20 — currency_mismatch_group

- **Severity:** warning
- **Message:** Row 20: Currency 'USD' differs from group default 'INR'
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 10/03/2026 |
  | notes |  |
  | amount | 84 |
  | paid_by | Rohan |
  | currency | USD |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | Beach shack lunch |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'keep_or_convert', 'default': 'INR', 'options': ['keep_currency', 'convert_to_group_default'], 'raw_value': 'USD'}
  ```

### 34. Row 20 — ambiguous_date

- **Severity:** warning
- **Message:** Row 20: Date '10/03/2026' is ambiguous (DD/MM vs MM/DD)
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 10/03/2026 |
  | notes |  |
  | amount | 84 |
  | paid_by | Rohan |
  | currency | USD |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | Beach shack lunch |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_format', 'options': ['dd_mm_yyyy', 'mm_dd_yyyy'], 'raw_value': '10/03/2026'}
  ```

### 35. Row 21 — unknown_participant

- **Severity:** error
- **Message:** Row 21: Participant 'Dev' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 10/03/2026 |
  | notes | Rohan and Dev took the bigger ones |
  | amount | 3600 |
  | paid_by | Priya |
  | currency | INR |
  | split_type | share |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | Scooter rentals |
  | split_details | Aisha 1; Rohan 2; Priya 1; Dev 2 |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Dev'}
  ```

### 36. Row 21 — ambiguous_date

- **Severity:** warning
- **Message:** Row 21: Date '10/03/2026' is ambiguous (DD/MM vs MM/DD)
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 10/03/2026 |
  | notes | Rohan and Dev took the bigger ones |
  | amount | 3600 |
  | paid_by | Priya |
  | currency | INR |
  | split_type | share |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | Scooter rentals |
  | split_details | Aisha 1; Rohan 2; Priya 1; Dev 2 |
- **Suggested action:**

  ```json
  {'type': 'select_format', 'options': ['dd_mm_yyyy', 'mm_dd_yyyy'], 'raw_value': '10/03/2026'}
  ```

### 37. Row 22 — unknown_participant

- **Severity:** error
- **Message:** Row 22: Participant 'Dev' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 11/03/2026 |
  | notes | Kabir joined for the day |
  | amount | 150 |
  | paid_by | Dev |
  | currency | USD |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev;Dev's friend Kabir |
  | description | Parasailing |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Dev'}
  ```

### 38. Row 22 — unknown_participant

- **Severity:** error
- **Message:** Row 22: Participant 'Dev's friend Kabir' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 11/03/2026 |
  | notes | Kabir joined for the day |
  | amount | 150 |
  | paid_by | Dev |
  | currency | USD |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev;Dev's friend Kabir |
  | description | Parasailing |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': "Dev's friend Kabir"}
  ```

### 39. Row 22 — unknown_participant

- **Severity:** error
- **Message:** Row 22: Payer 'Dev' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 11/03/2026 |
  | notes | Kabir joined for the day |
  | amount | 150 |
  | paid_by | Dev |
  | currency | USD |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev;Dev's friend Kabir |
  | description | Parasailing |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_payer', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S']}
  ```

### 40. Row 22 — ambiguous_date

- **Severity:** warning
- **Message:** Row 22: Date '11/03/2026' is ambiguous (DD/MM vs MM/DD)
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 11/03/2026 |
  | notes | Kabir joined for the day |
  | amount | 150 |
  | paid_by | Dev |
  | currency | USD |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev;Dev's friend Kabir |
  | description | Parasailing |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_format', 'options': ['dd_mm_yyyy', 'mm_dd_yyyy'], 'raw_value': '11/03/2026'}
  ```

### 41. Row 22 — currency_mismatch_group

- **Severity:** warning
- **Message:** Row 22: Currency 'USD' differs from group default 'INR'
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 11/03/2026 |
  | notes | Kabir joined for the day |
  | amount | 150 |
  | paid_by | Dev |
  | currency | USD |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev;Dev's friend Kabir |
  | description | Parasailing |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'keep_or_convert', 'default': 'INR', 'options': ['keep_currency', 'convert_to_group_default'], 'raw_value': 'USD'}
  ```

### 42. Row 23 — unknown_participant

- **Severity:** error
- **Message:** Row 23: Participant 'Dev' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 11/03/2026 |
  | notes |  |
  | amount | 2400 |
  | paid_by | Aisha |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | Dinner at Thalassa |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Dev'}
  ```

### 43. Row 23 — ambiguous_date

- **Severity:** warning
- **Message:** Row 23: Date '11/03/2026' is ambiguous (DD/MM vs MM/DD)
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 11/03/2026 |
  | notes |  |
  | amount | 2400 |
  | paid_by | Aisha |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | Dinner at Thalassa |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_format', 'options': ['dd_mm_yyyy', 'mm_dd_yyyy'], 'raw_value': '11/03/2026'}
  ```

### 44. Row 24 — unknown_participant

- **Severity:** error
- **Message:** Row 24: Participant 'Dev' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 11/03/2026 |
  | notes | Aisha also logged this I think hers is wrong |
  | amount | 2450 |
  | paid_by | Rohan |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | Thalassa dinner |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Dev'}
  ```

### 45. Row 24 — ambiguous_date

- **Severity:** warning
- **Message:** Row 24: Date '11/03/2026' is ambiguous (DD/MM vs MM/DD)
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 11/03/2026 |
  | notes | Aisha also logged this I think hers is wrong |
  | amount | 2450 |
  | paid_by | Rohan |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | Thalassa dinner |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_format', 'options': ['dd_mm_yyyy', 'mm_dd_yyyy'], 'raw_value': '11/03/2026'}
  ```

### 46. Row 25 — unknown_participant

- **Severity:** error
- **Message:** Row 25: Payer 'Dev' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 12/03/2026 |
  | notes | one slot got cancelled |
  | amount | -30 |
  | paid_by | Dev |
  | currency | USD |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | Parasailing refund |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_payer', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S']}
  ```

### 47. Row 25 — unknown_participant

- **Severity:** error
- **Message:** Row 25: Participant 'Dev' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 12/03/2026 |
  | notes | one slot got cancelled |
  | amount | -30 |
  | paid_by | Dev |
  | currency | USD |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | Parasailing refund |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Dev'}
  ```

### 48. Row 25 — ambiguous_date

- **Severity:** warning
- **Message:** Row 25: Date '12/03/2026' is ambiguous (DD/MM vs MM/DD)
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 12/03/2026 |
  | notes | one slot got cancelled |
  | amount | -30 |
  | paid_by | Dev |
  | currency | USD |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | Parasailing refund |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_format', 'options': ['dd_mm_yyyy', 'mm_dd_yyyy'], 'raw_value': '12/03/2026'}
  ```

### 49. Row 25 — negative_amount

- **Severity:** warning
- **Message:** Row 25: Amount is negative (-30) - possible refund
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 12/03/2026 |
  | notes | one slot got cancelled |
  | amount | -30 |
  | paid_by | Dev |
  | currency | USD |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | Parasailing refund |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'convert_to_settlement_or_keep', 'options': ['keep_as_negative_expense', 'convert_to_settlement', 'reject']}
  ```

### 50. Row 25 — currency_mismatch_group

- **Severity:** warning
- **Message:** Row 25: Currency 'USD' differs from group default 'INR'
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 12/03/2026 |
  | notes | one slot got cancelled |
  | amount | -30 |
  | paid_by | Dev |
  | currency | USD |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | Parasailing refund |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'keep_or_convert', 'default': 'INR', 'options': ['keep_currency', 'convert_to_group_default'], 'raw_value': 'USD'}
  ```

### 51. Row 26 — unknown_participant

- **Severity:** error
- **Message:** Row 26: Participant 'Dev' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | Mar 14 |
  | notes |  |
  | amount | 1100 |
  | paid_by | rohan |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Dev |
  | description | Airport cab |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Dev'}
  ```

### 52. Row 27 — invalid_currency

- **Severity:** error
- **Message:** Row 27: Currency is empty
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 15/03/2026 |
  | notes | forgot to set currency |
  | amount | 2105 |
  | paid_by | Priya |
  | currency |  |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Groceries DMart |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_currency', 'default': 'INR', 'options': ['INR', 'USD', 'EUR', 'GBP']}
  ```

### 53. Row 27 — unknown_participant

- **Severity:** error
- **Message:** Row 27: Participant 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 15/03/2026 |
  | notes | forgot to set currency |
  | amount | 2105 |
  | paid_by | Priya |
  | currency |  |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Groceries DMart |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Meera'}
  ```

### 54. Row 28 — unknown_participant

- **Severity:** error
- **Message:** Row 28: Participant 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 18/03/2026 |
  | notes |  |
  | amount | 1450 |
  | paid_by | Aisha |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Electricity Mar |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Meera'}
  ```

### 55. Row 29 — unknown_participant

- **Severity:** error
- **Message:** Row 29: Participant 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 20/03/2026 |
  | notes |  |
  | amount | 3000 |
  | paid_by | Meera |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Maid salary Mar |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Meera'}
  ```

### 56. Row 29 — unknown_participant

- **Severity:** error
- **Message:** Row 29: Payer 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 20/03/2026 |
  | notes |  |
  | amount | 3000 |
  | paid_by | Meera |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Maid salary Mar |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_payer', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S']}
  ```

### 57. Row 30 — unknown_participant

- **Severity:** error
- **Message:** Row 30: Participant 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 22/03/2026 |
  | notes | counted twice earlier - fixing later |
  | amount | 0 |
  | paid_by | Priya |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Dinner order Swiggy |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Meera'}
  ```

### 58. Row 30 — zero_amount

- **Severity:** warning
- **Message:** Row 30: Amount is zero
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 22/03/2026 |
  | notes | counted twice earlier - fixing later |
  | amount | 0 |
  | paid_by | Priya |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Dinner order Swiggy |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'confirm_or_reject'}
  ```

### 59. Row 31 — unknown_participant

- **Severity:** error
- **Message:** Row 31: Participant 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 25/03/2026 |
  | notes |  |
  | amount | 2200 |
  | paid_by | Meera |
  | currency | INR |
  | split_type | percentage |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Weekend brunch |
  | split_details | Aisha 30%; Rohan 30%; Priya 30%; Meera 20% |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Meera'}
  ```

### 60. Row 31 — unknown_participant

- **Severity:** error
- **Message:** Row 31: Payer 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 25/03/2026 |
  | notes |  |
  | amount | 2200 |
  | paid_by | Meera |
  | currency | INR |
  | split_type | percentage |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Weekend brunch |
  | split_details | Aisha 30%; Rohan 30%; Priya 30%; Meera 20% |
- **Suggested action:**

  ```json
  {'type': 'select_payer', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S']}
  ```

### 61. Row 31 — invalid_percentages

- **Severity:** error
- **Message:** Row 31: Percentages sum to 110%, must be 100%
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 25/03/2026 |
  | notes |  |
  | amount | 2200 |
  | paid_by | Meera |
  | currency | INR |
  | split_type | percentage |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Weekend brunch |
  | split_details | Aisha 30%; Rohan 30%; Priya 30%; Meera 20% |
- **Suggested action:**

  ```json
  {'type': 'normalize_or_reject'}
  ```

### 62. Row 32 — unknown_participant

- **Severity:** error
- **Message:** Row 32: Participant 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 28/03/2026 |
  | notes | Meera moving out Sunday :( |
  | amount | 4800 |
  | paid_by | Aisha |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Meera farewell dinner |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Meera'}
  ```

### 63. Row 33 — ambiguous_date

- **Severity:** warning
- **Message:** Row 33: Date '04/05/2026' is ambiguous (DD/MM vs MM/DD)
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 04/05/2026 |
  | notes | is this April 5 or May 4? format is a mess |
  | amount | 2500 |
  | paid_by | Rohan |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya |
  | description | Deep cleaning service |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_format', 'options': ['dd_mm_yyyy', 'mm_dd_yyyy'], 'raw_value': '04/05/2026'}
  ```

### 64. Row 35 — unknown_participant

- **Severity:** error
- **Message:** Row 35: Participant 'Meera' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-04-02 |
  | notes | oops Meera still in the group list |
  | amount | 2640 |
  | paid_by | Priya |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Meera |
  | description | Groceries BigBasket |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Meera'}
  ```

### 65. Row 37 — unknown_participant

- **Severity:** error
- **Message:** Row 37: Payer 'Sam' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-04-08 |
  | notes | Sam moving in! paid Aisha his deposit |
  | amount | 15000 |
  | paid_by | Sam |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha |
  | description | Sam deposit share |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_payer', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S']}
  ```

### 66. Row 37 — settlement_as_expense

- **Severity:** warning
- **Message:** Row 37: 'Sam deposit share' looks like a settlement, not an expense
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-04-08 |
  | notes | Sam moving in! paid Aisha his deposit |
  | amount | 15000 |
  | paid_by | Sam |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha |
  | description | Sam deposit share |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'convert_to_settlement_or_keep', 'options': ['keep_as_expense', 'convert_to_settlement', 'reject']}
  ```

### 67. Row 38 — unknown_participant

- **Severity:** error
- **Message:** Row 38: Payer 'Sam' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-04-10 |
  | notes |  |
  | amount | 3100 |
  | paid_by | Sam |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Sam |
  | description | Housewarming drinks |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_payer', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S']}
  ```

### 68. Row 38 — unknown_participant

- **Severity:** error
- **Message:** Row 38: Participant 'Sam' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-04-10 |
  | notes |  |
  | amount | 3100 |
  | paid_by | Sam |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Sam |
  | description | Housewarming drinks |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Sam'}
  ```

### 69. Row 39 — unknown_participant

- **Severity:** error
- **Message:** Row 39: Participant 'Sam' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-04-12 |
  | notes |  |
  | amount | 1380 |
  | paid_by | Aisha |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Sam |
  | description | Electricity Apr |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Sam'}
  ```

### 70. Row 40 — unknown_participant

- **Severity:** error
- **Message:** Row 40: Payer 'Sam' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-04-15 |
  | notes |  |
  | amount | 1990 |
  | paid_by | Sam |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Sam |
  | description | Groceries DMart |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'select_payer', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S']}
  ```

### 71. Row 40 — unknown_participant

- **Severity:** error
- **Message:** Row 40: Participant 'Sam' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-04-15 |
  | notes |  |
  | amount | 1990 |
  | paid_by | Sam |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Sam |
  | description | Groceries DMart |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Sam'}
  ```

### 72. Row 41 — unknown_participant

- **Severity:** error
- **Message:** Row 41: Participant 'Sam' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-04-18 |
  | notes | split_type says equal but someone added shares anyway |
  | amount | 12000 |
  | paid_by | Aisha |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Sam |
  | description | Furniture for common room |
  | split_details | Aisha 1; Rohan 1; Priya 1; Sam 1 |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Sam'}
  ```

### 73. Row 41 — split_details_format_mismatch

- **Severity:** warning
- **Message:** Row 41: Split type is 'equal' but split_details contain values
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-04-18 |
  | notes | split_type says equal but someone added shares anyway |
  | amount | 12000 |
  | paid_by | Aisha |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Sam |
  | description | Furniture for common room |
  | split_details | Aisha 1; Rohan 1; Priya 1; Sam 1 |
- **Suggested action:**

  ```json
  {'type': 'clear_details_or_change_split_type'}
  ```

### 74. Row 42 — unknown_participant

- **Severity:** error
- **Message:** Row 42: Participant 'Sam' does not match any group member
- **Decision:** approve
- **Raw row:**

  | Field | Value |
  |-------|-------|
  | date | 2026-04-20 |
  | notes |  |
  | amount | 3000 |
  | paid_by | Priya |
  | currency | INR |
  | split_type | equal |
  | split_with | Aisha;Rohan;Priya;Sam |
  | description | Maid salary Apr |
  | split_details |  |
- **Suggested action:**

  ```json
  {'type': 'map_or_reject', 'options': ['Chandan Singh', 'Aisha', 'Rohan', 'Priya', 'Priya S'], 'raw_value': 'Sam'}
  ```

## Final Counts

- Total rows: `42`
- Imported: `32`
- Rejected: `10`

### Anomalies by Type

- `zero_amount`: 1
- `missing_payer`: 1
- `ambiguous_date`: 11
- `negative_amount`: 1
- `invalid_currency`: 1
- `invalid_split_type`: 1
- `invalid_percentages`: 2
- `unknown_participant`: 49
- `settlement_as_expense`: 2
- `currency_mismatch_group`: 4
- `split_details_format_mismatch`: 1

### Actions by Decision

- `approve`: 74

---

_Report generated at 2026-06-15T02:21:29.195335_
