# AI-Assisted Development Notes

This document records how AI tools (primarily Claude Code / Anthropic models were used during the development of this project, including specific examples where AI output was incorrect or required revision.

---

## 1. AI Tools Used

| Tool | Role |
|------|------|
| **Claude (Anthropic) with Open Source Models** (like MiniMax : 3 , nemotron-3-ultra-fp4 & minimax-m2.7 )| Primary coding assistant - implemented features, wrote tests, debugged, refactored |
| **GitHub Copilot (briefly, in IDE)** | Inline autocompletion; not central , for debugging after ai comp|

The Claude code ran Models in a multi-turn conversational loop with tool access (Bash, Edit, Read, Grep, Agent). For each major task the assistant would:
1. Read relevant files to understand context
2. Form a plan
3. Implement, test, verify
4. Iterate based on feedback

---

## 2. How AI Contributed

Across the project, AI was used for:

- **Scaffolding**: initial backend API routes, React component structure, TypeScript types
- **Bulk implementation**: building CRUD endpoints, forms, list views
- **Refactoring**: extracting shared `Layout` component, deduplicating patterns
- **Bug fixes**: date comparison bug, UUID serialization, missing-flux in `update_expense`
- **Documentation**: drafting all four required `.md` files
- **Deployment configuration**: `render.yaml`, `vercel.json`, env templates

Approximately 80% of the codebase was written by AI, with the remaining 20% being manual debugging, deployment tweaks, and integration glue.

---

## 3. Examples of Incorrect / Incomplete AI Output

The assignment requires at least three specific examples where AI generated incorrect, incomplete, or unsuitable solutions. Here are seven.

### 3.1 - Date comparison bug: `datetime <= date` raises `TypeError`

**What happened**:
The AI-generated `_validate_payer()` method in `expense_service.py` compared SQLAlchemy columns directly to a Python `date` object:
```python
GroupMember.joined_at <= expense_date
```
`joined_at` is a `TIMESTAMPTZ` (a `datetime`), and `expense_date` is a `date`. Python refuses to compare them, raising `TypeError: can't compare datetime.datetime to datetime.date`.

**Why it was incorrect**:
The SQL layer also couldn't infer the comparison because the types mismatch. The query silently returned empty results, and the backend raised `ValidationError("Payer was not a group member on expense date")` even when the payer was a current member.

**How identified**:
Reproduced by importing an expense with the logged-in user as payer against a group where they had just been added. The 500 error in the backend logs included the full Python traceback.

**How fixed**:
Converted the `date` to a timezone-aware `datetime` at the start of day (later changed to end of day to handle time-of-day edge cases):
```python
expense_datetime = datetime.combine(expense_date, time.max, tzinfo=timezone.utc)
```
And compared against `expense_datetime` instead of `expense_date`. Tested again with the same scenario - works correctly.

**Lesson**:
Always check type compatibility at the SQLAlchemy layer. A `Date` column compared to a `TIMESTAMPTZ` value (or vice-versa) is silently wrong in many cases - and loud-explicit-wrong in others.

---

### 3.2 - UUID serialization failure on `suggested_action`

**What happened**:
The AI-generated anomaly detector stuffed Python `UUID` objects into the `suggested_action.options` array:
```python
suggested_action={
    "type": "confirm_mapping",
    "raw_value": raw_payer,
    "mapped_to": user.get("id"),  # ← UUID object
    "mapped_name": matched_name,
}
```
PostgreSQL's JSONB column requires JSON-serializable values; the `INSERT` failed with `TypeError: Object of type UUID is not JSON serializable`.

**Why it was incorrect**:
The dev-time model uses SQLite, which silently coerces UUIDs to strings. The bug only surfaced against PostgreSQL. Local tests passed; production failed.

**How identified**:
Tried to upload the assignment CSV against a Neon PostgreSQL instance - backend returned 500 with a clear traceback in the logs.

**How fixed**:
Two layers of defense:
1. **At the source**: wrapped every `user.get("id")` in `str(...)` in `anomaly_service.py`.
2. **At the boundary**: added a `_sanitize_json()` helper in `csv_import_service.py` that recursively converts UUIDs/datetimes/Decimals before insertion.

**Lesson**:
ORM dev environments (SQLite) and prod (PostgreSQL) can behave very differently for type-coercion rules. Add a serialization layer at the JSONB boundary even if it seems redundant.

---

### 3.3 - Frontend compared Clerk ID to internal UUID, button never appeared

**What happened**:
The AI-generated `GroupDetail.tsx` initially had:
```tsx
const isAdmin = members?.some(m => m.user_id === user?.id && ...)
```
But `user.id` from Clerk is the **external Clerk ID** (e.g., `user_3F7oLSY1Td0288yVLWy8YwPyOEb`), while `member.user_id` is the **internal database UUID** (e.g., `125283ef-ecc2-43f8-a6cf-197f024687ce`). They never matched, so the "Add Member" button never rendered for the admin.

**Why it was incorrect**:
The AI assumed `user.id` from Clerk would be the same value as the database `users.id`. They're different by design - Clerk uses prefixed strings (`user_xxx`), our DB uses standard UUIDs.

**How identified**:
User reported "I can't see the Add Member button even though I'm an admin." Manually inspected the API response (`/groups/:id/members`) and saw `clerk_id: "user_xxx"` - that was the field to compare against.

**How fixed**:
Added `clerk_id` to the API response and updated the frontend:
```tsx
const isAdmin = members?.some(m => m.clerk_id === user?.id && m.role === "admin" && m.is_active)
```

**Lesson**:
Don't assume identity fields are the same across system boundaries. Check the actual shape of the API response and use explicit field names (`clerk_id`, `user_id`) rather than guessing.

---

### 3.4 - Slow Approve All due to per-row PATCH + per-row UPDATE

**What happened**:
Initial implementation had two problems:
1. **Frontend**: each anomaly was approved with a separate `PATCH` request (50 round trips).
2. **Backend**: the bulk approve method fetched all anomalies, set the decision in Python, then flushed per row.

Result: 10–17 seconds for "Approve All" on a 42-row CSV with 50 anomalies.

**Why it was incorrect**:
Naive code that works for small datasets becomes a performance disaster at scale. SQLAlchemy's per-row `flush()` issues one UPDATE statement per object.

**How identified**:
User reported "Approve All is so slow". We measured timing: 17.3 seconds for 50 anomalies. Also noticed the frontend was making 50 separate network requests.

**How fixed**:
1. **Backend**: replaced the loop with a single SQL `UPDATE ... WHERE user_decision IS NULL` using `sqlalchemy.update()`. Time: 1.2s.
2. **Frontend**: added a dedicated `POST /imports/:job_id/approve-all` endpoint and called it once. Combined with React Query optimistic updates, perceived latency dropped to near-zero.

**Lesson**:
"Approve All" sounds like a UI feature, but it's really a batch operation. Build a dedicated endpoint and use optimistic UI for the perceived performance win.

---

### 3.5 - AsyncSession imported but never used

**What happened**:
The AI-generated services had:
```python
from sqlalchemy.ext.asyncio import AsyncSession
class CSVImportService:
    def __init__(self, session: AsyncSession):
        self.session = session
```
But the rest of the code uses `db.session` (sync, from Flask-SQLAlchemy). Mixing `AsyncSession` type hints with sync session usage is misleading and could lead to subtle bugs if anyone ever actually uses `await self.session.execute(...)`.

**Why it was incorrect**:
The code "worked" because nothing actually relied on the `AsyncSession` semantics - it was a copy-paste from a tutorial. But the type hint promised async behaviour that didn't exist.

**How identified**:
Code review during a refactor. Found the mismatch and removed the AsyncSession import.

**How fixed**:
Removed the unused import and updated the type hints to `db.session` (which is sync). The services now consistently use sync SQLAlchemy throughout.

**Lesson**:
Type hints are documentation as much as they are compiler directives. Don't paste imports from tutorials without verifying the actual code uses the imported symbols.

---

### 3.6 - EditExpense form initialized in render body, causing infinite re-renders

**What happened**:
The AI-generated `EditExpense.tsx` had:
```tsx
if (expense && !date) {
  setDescription(expense.description)
  setAmount(expense.amount.toString())
  // ...
}
```
inside the render body. Calling `setState` during render causes an infinite re-render loop.

**Why it was incorrect**:
React requires `setState` calls to happen in event handlers, `useEffect`, or async callbacks - not synchronously during render.

**How identified**:
React dev console warning: "Cannot update a component while rendering a different component". Performance tab showed re-renders every frame.

**How fixed**:
Moved the form initialization into a `useEffect`:
```tsx
useEffect(() => {
  if (expense && !initialized) {
    setDescription(expense.description)
    // ...
    setInitialized(true)
  }
}, [expense, initialized])
```
Plus an `initialized` flag so it doesn't re-run on every fetch.

**Lesson**:
State updates during render are a common React anti-pattern. Use `useEffect` for any logic that depends on external data and updates state.

---

### 3.7 - Duplicate participant inserts on commit

**What happened**:
The AI-generated `commit_import()` method in `csv_import_service.py` appended participants without deduplicating:
```python
for pname in participant_names:
    pmember = member_map.get(pname_lower)
    if pmember:
        participants.append(pmember)
```
If the same person appeared twice in `split_with` (or if the payer was also in `split_with`), they were added twice, causing the unique constraint `UNIQUE(expense_id, user_id)` to fail.

**Why it was incorrect**:
The bug only triggered when the same name appeared twice in a single row - an edge case that wasn't covered by the test fixture.

**How identified**:
Tried to import the CSV after fixing all other bugs. Got a 500 error with the traceback pointing at the unique constraint violation.

**How fixed**:
Added a deduplication check:
```python
if pmember:
    if not any(p["id"] == pmember["id"] for p in participants):
        participants.append(pmember)
```

**Lesson**:
CSV data can have repeat values. Always assume "duplicates may exist" and dedupe by primary key before insert.

---

## 4. Working Agreement With AI

After these incidents, the workflow stabilized:

1. **The user reviews every commit.** Nothing is auto-pushed.
2. **Before submitting any task, AI runs a build** (`npm run build` for frontend, `python3 -c "import ast..."` for backend) to catch syntax/type errors.
3. **Performance-sensitive changes are timed** before and after with `time` so we have hard numbers.
4. **Backend changes are tested against the actual CSV** in `~/.csv` before being declared done.
5. **The user explicitly approves** large refactors or new features.

This means AI output is treated as a **first draft** that gets verified, not as final code. We catch issues at the boundary (build, test, manual exercise) before they reach production.
