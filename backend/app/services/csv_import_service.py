import csv
import io
import json
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ImportJob, ImportAnomaly, ImportReport, Group, GroupMember, Expense, ExpenseParticipant, User
from app.services.anomaly_service import AnomalyDetector
from app.utils.dates import parse_flexible_date
from app.utils.currency import normalize_amount
from app.utils.exceptions import ValidationError, NotFoundError


EXPECTED_HEADERS = [
    "date", "description", "paid_by", "amount", "currency",
    "split_type", "split_with", "split_details", "notes",
]

# Documented anomaly handling policy
ANOMALY_POLICY = {
    "ambiguous_date": {
        "default": "assume_dd_mm_yyyy",
        "reason": "Indian context (INR currency) — DD/MM is the local convention",
    },
    "currency_mismatch_group": {
        "default": "keep_original",
        "reason": "USD expenses stay in USD; group currency is for display only",
    },
    "negative_amount": {
        "default": "convert_to_settlement",
        "reason": "Negative amounts are typically refunds/payments back — convert to settlement",
    },
    "zero_amount": {
        "default": "skip",
        "reason": "Zero-amount expenses are placeholders, not real expenses",
    },
    "unknown_participant": {
        "default": "approve_only_if_mapped",
        "reason": "User must explicitly map the name to a real group member, or the row is dropped",
    },
    "name_fuzzy_mismatch": {
        "default": "approve_if_correct",
        "reason": "Fuzzy match is best-effort; user must confirm the mapping is correct",
    },
    "invalid_percentages": {
        "default": "normalize_to_100",
        "reason": "If percentages sum to 110%, scale each proportionally so they sum to 100%",
    },
    "settlement_as_expense": {
        "default": "convert_to_settlement",
        "reason": "Detected as settlement by keywords ('paid back', 'deposit share') — convert to settlement record",
    },
    "missing_payer": {
        "default": "skip",
        "reason": "Cannot record expense without knowing who paid — row is dropped",
    },
    "invalid_currency": {
        "default": "use_group_default",
        "reason": "Use the group's default currency (INR) when currency field is empty",
    },
    "invalid_split_type": {
        "default": "use_equal",
        "reason": "Treat as equal split when split type is missing or unknown",
    },
    "split_details_format_mismatch": {
        "default": "use_split_type",
        "reason": "If split_type is 'equal' but details provided, ignore details and use equal split",
    },
    "duplicate_within_csv": {
        "default": "keep_both",
        "reason": "Cannot determine which is authoritative — keep both rows (reviewer should manually dedupe)",
    },
    "duplicate_with_existing": {
        "default": "keep_both",
        "reason": "Similar expense already exists in group — keep both; reviewer should manually reconcile",
    },
    "member_not_active_on_date": {
        "default": "include_anyway",
        "reason": "User wasn't a member on the expense date — exclude from participants, but keep expense",
    },
}


class CSVImportService:
    def __init__(self, session: AsyncSession):
        self.session = session

    def parse_and_validate(
        self,
        csv_content: str,
        group_id: uuid.UUID,
        uploaded_by: uuid.UUID,
    ) -> ImportJob:
        rows = self._parse_csv(csv_content)
        if not rows:
            raise ValidationError("CSV file is empty or invalid")

        group = self.session.get(Group, group_id)
        if not group:
            raise NotFoundError("Group not found")

        members = self._get_group_members(group_id)
        existing_expenses = self._get_existing_expenses(group_id)

        job = ImportJob(
            group_id=group_id,
            uploaded_by=uploaded_by,
            filename=f"import_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv",
            original_csv=csv_content,
            status="parsed",
            total_rows=len(rows),
        )
        self.session.add(job)
        self.session.flush()

        detector = AnomalyDetector(members, group.default_currency)
        anomalies = detector.detect_anomalies(rows, existing_expenses)

        for anomaly in anomalies:
            self.session.add(ImportAnomaly(
                import_job_id=job.id,
                row_number=anomaly.row_number,
                anomaly_type=anomaly.anomaly_type,
                severity=anomaly.severity,
                message=anomaly.message,
                suggested_action=self._sanitize_json(anomaly.suggested_action),
                raw_row_data=self._sanitize_json(anomaly.raw_row_data),
            ))

        has_errors = any(a.severity == "error" for a in anomalies)
        job.status = "reviewing" if has_errors else "ready"
        self.session.flush()
        return job

    def resolve_anomaly(
        self,
        anomaly_id: uuid.UUID,
        decision: str,
        resolution: Optional[dict] = None,
    ) -> ImportAnomaly:
        result = self.session.execute(
            select(ImportAnomaly).where(ImportAnomaly.id == anomaly_id)
        )
        anomaly = result.scalar_one_or_none()
        if not anomaly:
            raise NotFoundError("Anomaly not found")

        anomaly.user_decision = decision
        anomaly.user_resolution = resolution
        anomaly.resolved_at = datetime.utcnow()
        self.session.flush()

        return anomaly

    def approve_all_anomalies(self, job_id: uuid.UUID, decision: str = "approve") -> int:
        """Mark all unresolved anomalies for a job as approve or reject. Returns count updated."""
        if decision not in ("approve", "reject"):
            raise ValidationError("decision must be 'approve' or 'reject'")

        # Bulk update — much faster than fetching then updating one by one
        from sqlalchemy import update
        now = datetime.utcnow()
        result = self.session.execute(
            update(ImportAnomaly)
            .where(
                ImportAnomaly.import_job_id == job_id,
                ImportAnomaly.user_decision.is_(None),
            )
            .values(user_decision=decision, resolved_at=now)
        )
        return result.rowcount

    def get_summary(self, job_id: uuid.UUID) -> dict:
        """Get all the import data in a single call to avoid multiple round trips."""
        job = self.session.execute(
            select(ImportJob).where(ImportJob.id == job_id)
        ).scalar_one_or_none()
        if not job:
            raise NotFoundError("Import job not found")

        anomalies = self.session.execute(
            select(ImportAnomaly)
            .where(ImportAnomaly.import_job_id == job_id)
            .order_by(ImportAnomaly.row_number, ImportAnomaly.severity)
        ).scalars().all()

        result = {
            "job": {
                "id": str(job.id),
                "group_id": str(job.group_id),
                "filename": job.filename,
                "status": job.status,
                "total_rows": job.total_rows,
                "imported_rows": job.imported_rows,
                "rejected_rows": job.rejected_rows,
                "created_at": job.created_at.isoformat(),
                "completed_at": job.completed_at.isoformat() if job.completed_at else None,
            },
            "anomalies": [{
                "id": str(a.id),
                "import_job_id": str(a.import_job_id),
                "row_number": a.row_number,
                "anomaly_type": a.anomaly_type,
                "severity": a.severity,
                "message": a.message,
                "suggested_action": a.suggested_action,
                "raw_row_data": a.raw_row_data,
                "user_decision": a.user_decision,
                "user_resolution": a.user_resolution,
                "created_at": a.created_at.isoformat(),
                "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
            } for a in anomalies],
            "policy": ANOMALY_POLICY,
        }
        return result

    def commit_import(self, job_id: uuid.UUID, force: bool = False) -> ImportJob:
        result = self.session.execute(
            select(ImportJob).where(ImportJob.id == job_id)
        )
        job = result.scalar_one_or_none()
        if not job:
            raise NotFoundError("Import job not found")

        if job.status not in ("ready", "reviewing"):
            raise ValidationError(f"Cannot commit import in status '{job.status}'")

        anomalies_result = self.session.execute(
            select(ImportAnomaly).where(
                ImportAnomaly.import_job_id == job_id,
                ImportAnomaly.severity == "error",
                ImportAnomaly.user_decision.is_(None),
            )
        )
        unresolved_errors = anomalies_result.scalars().all()

        if unresolved_errors and not force:
            raise ValidationError(
                f"Cannot commit: {len(unresolved_errors)} unresolved error-level anomalies remain"
            )

        rows = self._parse_csv(job.original_csv)
        members = self._get_group_members(job.group_id)
        member_map = {m.get("full_name", "").lower(): m for m in members}
        for m in members:
            email_lower = m.get("email", "").lower()
            if email_lower:
                member_map[email_lower] = m
            first = (m.get("full_name", "") or "").split()[0].lower()
            if first:
                member_map[first] = m

        imported = 0
        rejected = 0
        expenses_to_add = []  # Bulk-add buffer for expenses
        pending_participants = []  # Bulk-add buffer for participants
        rejected_anomalies = self.session.execute(
            select(ImportAnomaly).where(
                ImportAnomaly.import_job_id == job_id,
                ImportAnomaly.user_decision == "reject",
            )
        ).scalars().all()
        rejected_rows = {a.row_number for a in rejected_anomalies}

        # Track why rows are rejected for the report
        rejection_reasons = []

        for idx, row in enumerate(rows, start=1):
            if idx in rejected_rows:
                rejected += 1
                rejection_reasons.append({
                    "row": idx,
                    "reason": "user_rejected",
                    "description": row.get("description", ""),
                })
                continue

            try:
                expense_date, _ = parse_flexible_date(str(row.get("date", "")))
                if not expense_date:
                    rejected += 1
                    rejection_reasons.append({
                        "row": idx,
                        "reason": "unparseable_date",
                        "description": row.get("description", ""),
                    })
                    continue

                raw_amount = str(row.get("amount", "")).replace(",", "").replace(" ", "").strip()
                try:
                    amount = Decimal(raw_amount)
                except Exception:
                    rejected += 1
                    rejection_reasons.append({
                        "row": idx,
                        "reason": "invalid_amount",
                        "description": row.get("description", ""),
                    })
                    continue

                if amount == 0:
                    rejected += 1
                    rejection_reasons.append({
                        "row": idx,
                        "reason": "zero_amount",
                        "description": row.get("description", ""),
                    })
                    continue

                currency = str(row.get("currency", "")).strip().upper() or "INR"
                description = str(row.get("description", "")).strip()
                payer_name = str(row.get("paid_by", "")).strip().lower()
                split_type = str(row.get("split_type", "")).strip().lower() or "equal"

                if not payer_name:
                    rejected += 1
                    rejection_reasons.append({
                        "row": idx,
                        "reason": "missing_payer",
                        "description": row.get("description", ""),
                    })
                    continue

                payer = member_map.get(payer_name)
                if not payer:
                    for k, v in member_map.items():
                        if payer_name and (payer_name in k or any(payer_name.startswith(tok) for tok in k.split())):
                            payer = v
                            break
                if not payer:
                    rejected += 1
                    rejection_reasons.append({
                        "row": idx,
                        "reason": "no_matching_payer",
                        "description": row.get("description", ""),
                        "raw_payer": row.get("paid_by", ""),
                    })
                    continue

                split_with_str = row.get("split_with", "")
                split_details_str = row.get("split_details", "")
                participant_names = [n.strip() for n in split_with_str.split(";") if n.strip()]

                if not participant_names:
                    participant_names = [payer.get("full_name", "") or payer.get("email", "")]

                participants = []
                for pname in participant_names:
                    pname_lower = pname.lower().strip()
                    pmember = member_map.get(pname_lower)
                    if not pmember:
                        for k, v in member_map.items():
                            if pname_lower in k or any(pname_lower.startswith(tok) for tok in k.split()):
                                pmember = v
                                break
                    if pmember:
                        # Deduplicate by user id
                        if not any(p["id"] == pmember["id"] for p in participants):
                            participants.append(pmember)

                if not participants:
                    rejected += 1
                    rejection_reasons.append({
                        "row": idx,
                        "reason": "no_matching_participants",
                        "description": row.get("description", ""),
                    })
                    continue

                # Defer flush until end of batch for speed
                expenses_to_add.append(Expense(
                    group_id=job.group_id,
                    paid_by=payer["id"],
                    amount=abs(amount),
                    currency=currency,
                    description=description,
                    expense_date=expense_date,
                    split_type=split_type,
                    notes=row.get("notes", "").strip() or None,
                    created_by=job.uploaded_by,
                ))
                pending_participants.append({
                    "split_type": split_type,
                    "amount": abs(amount),
                    "participants": participants,
                    "split_details": split_details_str,
                    "expense": expenses_to_add[-1],
                })
                imported += 1
            except Exception as e:
                rejected += 1
                rejection_reasons.append({
                    "row": idx,
                    "reason": f"unexpected_error:{type(e).__name__}",
                    "description": row.get("description", ""),
                })
                continue

        # Bulk add all expenses in one go
        for exp in expenses_to_add:
            self.session.add(exp)
        # Single flush to get all IDs at once
        self.session.flush()

        # Now bulk-create all participants
        all_participants = []
        for item in pending_participants:
            split_type = item["split_type"]
            amt = item["amount"]
            parts = item["participants"]
            details = item["split_details"]
            exp = item["expense"]

            if split_type == "equal":
                share_amount = (amt / len(parts)).quantize(Decimal("0.01"))
                for p in parts:
                    all_participants.append(ExpenseParticipant(
                        expense_id=exp.id,
                        user_id=p["id"],
                        amount_owed=share_amount,
                    ))
            elif split_type == "shares":
                if details:
                    share_parts = re.findall(r"(\d+)", details)
                    total_shares = sum(int(s) for s in share_parts)
                    if total_shares > 0:
                        for i, p in enumerate(parts):
                            s = int(share_parts[i]) if i < len(share_parts) else 1
                            owed = (amt * s / total_shares).quantize(Decimal("0.01"))
                            all_participants.append(ExpenseParticipant(
                                expense_id=exp.id,
                                user_id=p["id"],
                                share_value=Decimal(s),
                                amount_owed=owed,
                            ))
            elif split_type == "percentage":
                if details:
                    pct_parts = re.findall(r"(\d+(?:\.\d+)?)\s*%", details)
                    if pct_parts:
                        total_pct = sum(Decimal(p) for p in pct_parts)
                        if total_pct > 0:
                            scale = Decimal("100") / total_pct
                            for i, p in enumerate(parts):
                                pct = Decimal(pct_parts[i]) if i < len(pct_parts) else Decimal(0)
                                normalized_pct = pct * scale
                                owed = (amt * normalized_pct / Decimal("100")).quantize(Decimal("0.01"))
                                all_participants.append(ExpenseParticipant(
                                    expense_id=exp.id,
                                    user_id=p["id"],
                                    share_value=pct,
                                    amount_owed=owed,
                                ))
            else:
                share_amount = (amt / len(parts)).quantize(Decimal("0.01"))
                for p in parts:
                    all_participants.append(ExpenseParticipant(
                        expense_id=exp.id,
                        user_id=p["id"],
                        amount_owed=share_amount,
                    ))

        # Bulk add all participants in one go
        self.session.bulk_save_objects(all_participants)
        self.session.flush()

        job.imported_rows = imported
        job.rejected_rows = rejected
        job.status = "completed"
        job.completed_at = datetime.utcnow()

        # Build comprehensive report data
        all_anomalies = self.session.execute(
            select(ImportAnomaly)
            .where(ImportAnomaly.import_job_id == job_id)
            .order_by(ImportAnomaly.row_number)
        ).scalars().all()

        anomaly_details = []
        for a in all_anomalies:
            anomaly_details.append({
                "row_number": a.row_number,
                "anomaly_type": a.anomaly_type,
                "severity": a.severity,
                "message": a.message,
                "decision": a.user_decision or "unresolved",
                "raw_row": self._sanitize_json(a.raw_row_data),
                "suggested_action": self._sanitize_json(a.suggested_action),
            })

        # Group identical anomalies (same type + same key value) for the report
        grouped_anomalies = self._group_anomalies(anomaly_details)

        report = ImportReport(
            import_job_id=job.id,
            report_data={
                "filename": job.filename,
                "total_rows": job.total_rows,
                "imported_rows": imported,
                "rejected_rows": rejected,
                "modified_rows": sum(1 for a in all_anomalies if a.user_decision == "approve"),
                "detected_anomalies": self._count_anomalies(job.id),
                "actions_taken": self._summarize_actions(job.id),
                "anomaly_details": anomaly_details,
                "grouped_anomalies": grouped_anomalies,
                "rejection_reasons": rejection_reasons,
                "policy": ANOMALY_POLICY,
                "generated_at": datetime.utcnow().isoformat(),
            },
        )
        self.session.add(report)
        self.session.flush()
        return job

    def get_report(self, job_id: uuid.UUID) -> ImportReport:
        result = self.session.execute(
            select(ImportReport).where(ImportReport.import_job_id == job_id)
        )
        report = result.scalar_one_or_none()
        if not report:
            raise NotFoundError("Report not found")
        return report

    def get_report_markdown(self, job_id: uuid.UUID) -> str:
        """Build a human-readable Markdown report for an import job."""
        job = self.session.execute(
            select(ImportJob).where(ImportJob.id == job_id)
        ).scalar_one_or_none()
        if not job:
            raise NotFoundError("Import job not found")

        anomalies = self.session.execute(
            select(ImportAnomaly)
            .where(ImportAnomaly.import_job_id == job_id)
            .order_by(ImportAnomaly.row_number, ImportAnomaly.severity)
        ).scalars().all()

        report = self.session.execute(
            select(ImportReport).where(ImportReport.import_job_id == job_id)
        ).scalar_one_or_none()

        # Build markdown
        lines = []
        lines.append(f"# Import Report")
        lines.append("")
        lines.append(f"- **File:** `{job.filename}`")
        lines.append(f"- **Job ID:** `{job.id}`")
        lines.append(f"- **Status:** {job.status}")
        lines.append(f"- **Created:** {job.created_at.isoformat()}")
        if job.completed_at:
            lines.append(f"- **Completed:** {job.completed_at.isoformat()}")
        lines.append("")

        # Outcome banner
        if job.status == "completed":
            if job.imported_rows > 0 and job.rejected_rows == 0:
                lines.append(f"> ✅ **All {job.imported_rows} rows imported successfully**")
            elif job.imported_rows > 0:
                lines.append(f"> ⚠️ **{job.imported_rows} rows imported, {job.rejected_rows} rows skipped**")
            else:
                lines.append(f"> ❌ **No rows imported — all {job.rejected_rows} rows were skipped**")
        lines.append("")

        lines.append("## Summary")
        lines.append("")
        lines.append(f"| Metric | Count |")
        lines.append(f"|--------|------:|")
        lines.append(f"| Total rows in CSV | {job.total_rows} |")
        lines.append(f"| Imported successfully | **{job.imported_rows}** |")
        lines.append(f"| Rejected | {job.rejected_rows} |")
        error_count = sum(1 for a in anomalies if a.severity == "error")
        warning_count = sum(1 for a in anomalies if a.severity == "warning")
        info_count = sum(1 for a in anomalies if a.severity == "info")
        lines.append(f"| Anomalies detected (error / warning / info) | {error_count} / {warning_count} / {info_count} |")
        approved = sum(1 for a in anomalies if a.user_decision == "approve")
        rejected_a = sum(1 for a in anomalies if a.user_decision == "reject")
        unresolved = sum(1 for a in anomalies if a.user_decision is None)
        lines.append(f"| User decisions (approve / reject / unresolved) | {approved} / {rejected_a} / {unresolved} |")
        lines.append("")

        if anomalies:
            lines.append("## Anomalies Detected (Grouped)")
            lines.append("")
            lines.append("Identical anomalies are grouped together. Expand the detailed breakdown below for row-by-row info.")
            lines.append("")
            lines.append("| # | Count | Type | Severity | Message | Decisions (A/R/U) |")
            lines.append("|---|------:|------|----------|---------|-------------------|")
            grouped = report.report_data.get("grouped_anomalies") if report and report.report_data else None
            if grouped:
                for i, g in enumerate(grouped, start=1):
                    sev = g["severity"].upper()
                    msg = g["message"].replace("|", "\\|").replace("\n", " ")
                    decisions = g.get("decisions", {})
                    d_str = f"{decisions.get('approve', 0)}/{decisions.get('reject', 0)}/{decisions.get('unresolved', 0)}"
                    rows = ", ".join(str(r) for r in g.get("row_numbers", [])[:10])
                    if len(g.get("row_numbers", [])) > 10:
                        rows += f", ... (+{len(g['row_numbers']) - 10} more)"
                    lines.append(f"| {i} | **{g['count']}** | `{g['anomaly_type']}` | **{sev}** | {msg} | {d_str} |")
                    lines.append(f"| _Rows: {rows}_ | | | | | |")
            else:
                # Fallback to ungrouped view
                for i, a in enumerate(anomalies, start=1):
                    sev = a.severity.upper()
                    decision = a.user_decision.upper() if a.user_decision else "UNRESOLVED"
                    msg = a.message.replace("|", "\\|").replace("\n", " ")
                    lines.append(f"| {i} | 1 | `{a.anomaly_type}` | **{sev}** | {msg} | {decision} |")
            lines.append("")

            # Detailed row-by-row breakdown
            lines.append("## Detailed Anomaly Breakdown")
            lines.append("")
            if grouped:
                for i, g in enumerate(grouped, start=1):
                    key_val = g.get("key_value", "")
                    lines.append(f"### {i}. {g['anomaly_type']} ({g['count']} occurrence{'s' if g['count'] > 1 else ''})")
                    if key_val:
                        lines.append("")
                        lines.append(f"- **Key value:** `{key_val}`")
                    lines.append("")
                    lines.append(f"- **Severity:** {g['severity']}")
                    lines.append(f"- **Message:** {g['message']}")
                    lines.append(f"- **Affected rows:** {', '.join(str(r) for r in g.get('row_numbers', []))}")
                    decisions = g.get("decisions", {})
                    lines.append(f"- **Decisions:** approved={decisions.get('approve', 0)}, rejected={decisions.get('reject', 0)}, unresolved={decisions.get('unresolved', 0)}")
                    lines.append("")
            else:
                for i, a in enumerate(anomalies, start=1):
                    lines.append(f"### {i}. Row {a.row_number} — {a.anomaly_type}")
                    lines.append("")
                    lines.append(f"- **Severity:** {a.severity}")
                    lines.append(f"- **Message:** {a.message}")
                    lines.append(f"- **Decision:** {a.user_decision or 'unresolved'}")
                    if a.raw_row_data:
                        lines.append("- **Raw row:**")
                        lines.append("")
                        lines.append("  | Field | Value |")
                        lines.append("  |-------|-------|")
                        for k, v in (a.raw_row_data or {}).items():
                            val = (str(v) if v is not None else "").replace("|", "\\|")
                            lines.append(f"  | {k} | {val} |")
                    if a.suggested_action:
                        lines.append("- **Suggested action:**")
                        lines.append("")
                        lines.append("  ```json")
                        lines.append(f"  {json.dumps(a.suggested_action, default=str)}")
                        lines.append("  ```")
                    lines.append("")

        # Rejection reasons
        if report and report.report_data and report.report_data.get("rejection_reasons"):
            lines.append("## Rejected Rows")
            lines.append("")
            lines.append("| Row | Reason | Description |")
            lines.append("|----:|--------|-------------|")
            for r in report.report_data["rejection_reasons"]:
                desc = (r.get("description", "") or "").replace("|", "\\|")
                lines.append(f"| {r.get('row')} | `{r.get('reason')}` | {desc} |")
            lines.append("")

        # Policy
        if report and report.report_data and report.report_data.get("policy"):
            lines.append("## Anomaly Handling Policy")
            lines.append("")
            lines.append("Default behaviour for each anomaly type:")
            lines.append("")
            lines.append("| Type | Default Action | Reason |")
            lines.append("|------|----------------|--------|")
            for k, v in (report.report_data["policy"] or {}).items():
                action = v.get("default", "").replace("_", " ")
                reason = v.get("reason", "")
                lines.append(f"| `{k}` | {action} | {reason} |")
            lines.append("")

        if report and report.report_data:
            lines.append("## Final Counts")
            lines.append("")
            lines.append(f"- Total rows: `{report.report_data.get('total_rows')}`")
            lines.append(f"- Imported: `{report.report_data.get('imported_rows')}`")
            lines.append(f"- Rejected: `{report.report_data.get('rejected_rows')}`")
            lines.append("")
            if report.report_data.get("detected_anomalies"):
                lines.append("### Anomalies by Type")
                lines.append("")
                for k, v in (report.report_data.get("detected_anomalies") or {}).items():
                    lines.append(f"- `{k}`: {v}")
                lines.append("")
            if report.report_data.get("actions_taken"):
                lines.append("### Actions by Decision")
                lines.append("")
                for k, v in (report.report_data.get("actions_taken") or {}).items():
                    lines.append(f"- `{k}`: {v}")
                lines.append("")

        lines.append("---")
        lines.append("")
        lines.append(f"_Report generated at {datetime.utcnow().isoformat()}_")
        lines.append("")
        return "\n".join(lines)

    def _parse_csv(self, csv_content: str) -> list[dict]:
        reader = csv.DictReader(io.StringIO(csv_content))
        headers = [h.strip().lower() for h in reader.fieldnames] if reader.fieldnames else []

        if not headers:
            reader = csv.DictReader(io.StringIO(csv_content), fieldnames=EXPECTED_HEADERS)
            next(reader, None)
            headers = [h.strip().lower() for h in reader.fieldnames] if reader.fieldnames else []

        rows = []
        for row in reader:
            cleaned = {k.strip().lower(): v.strip() if v else "" for k, v in row.items() if k}
            rows.append(cleaned)
        return rows

    def _get_group_members(self, group_id: uuid.UUID) -> list[dict]:
        result = self.session.execute(
            select(GroupMember, User)
            .join(User, GroupMember.user_id == User.id)
            .where(
                GroupMember.group_id == group_id,
                GroupMember.left_at.is_(None),
            )
        )
        members = []
        for gm, user in result:
            members.append({
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name or user.email.split("@")[0],
                "joined_at": gm.joined_at,
            })
        return members

    def _get_existing_expenses(self, group_id: uuid.UUID) -> list[dict]:
        result = self.session.execute(
            select(Expense).where(Expense.group_id == group_id)
        )
        expenses = []
        for exp in result.scalars().all():
            expenses.append({
                "id": str(exp.id),
                "description": exp.description,
                "amount": str(exp.amount),
                "date": str(exp.expense_date),
                "paid_by": str(exp.paid_by),
                "currency": exp.currency,
            })
        return expenses

    def _count_anomalies(self, job_id: uuid.UUID) -> dict:
        result = self.session.execute(
            select(ImportAnomaly).where(ImportAnomaly.import_job_id == job_id)
        )
        anomalies = result.scalars().all()
        counts = {}
        for a in anomalies:
            counts[a.anomaly_type] = counts.get(a.anomaly_type, 0) + 1
        return counts

    def _group_anomalies(self, anomaly_details: list) -> list:
        """Group anomalies by type + key value (e.g. same unknown name appearing many times).

        Returns a list of grouped anomalies, each with:
        - anomaly_type, severity, message, count, decisions, row_numbers
        - key_value (the value that triggered grouping, e.g. the unknown name)
        """
        from collections import OrderedDict
        groups = OrderedDict()

        for a in anomaly_details:
            # Build a grouping key
            sa = a.get("suggested_action") or {}
            raw_value = sa.get("raw_value") or sa.get("mapped_name") or sa.get("default") or ""
            # Use anomaly_type + raw_value as group key
            key = f"{a['anomaly_type']}::{raw_value}"

            if key not in groups:
                groups[key] = {
                    "anomaly_type": a["anomaly_type"],
                    "severity": a["severity"],
                    "message": a["message"],
                    "count": 0,
                    "row_numbers": [],
                    "decisions": {"approve": 0, "reject": 0, "unresolved": 0},
                    "key_value": raw_value,
                    "sample_raw_row": a.get("raw_row", {}),
                }
            g = groups[key]
            g["count"] += 1
            g["row_numbers"].append(a["row_number"])
            decision = a.get("decision") or "unresolved"
            g["decisions"][decision] = g["decisions"].get(decision, 0) + 1
            # Prefer message with first non-empty message
            if not g.get("message") and a.get("message"):
                g["message"] = a["message"]

        # Sort by count desc (most frequent first), then by severity
        severity_order = {"error": 0, "warning": 1, "info": 2}
        sorted_groups = sorted(
            groups.values(),
            key=lambda g: (-g["count"], severity_order.get(g["severity"], 99))
        )
        return sorted_groups

    def _summarize_actions(self, job_id: uuid.UUID) -> dict:
        result = self.session.execute(
            select(ImportAnomaly).where(ImportAnomaly.import_job_id == job_id)
        )
        anomalies = result.scalars().all()
        actions = {}
        for a in anomalies:
            decision = a.user_decision or "unresolved"
            actions[decision] = actions.get(decision, 0) + 1
        return actions

    def _sanitize_json(self, value):
        """Recursively convert UUID/datetime/Decimal values to JSON-serializable types."""
        import uuid as _uuid
        from datetime import datetime as _dt, date as _date
        from decimal import Decimal as _Dec

        if value is None:
            return None
        if isinstance(value, _uuid.UUID):
            return str(value)
        if isinstance(value, (_dt, _date)):
            return value.isoformat()
        if isinstance(value, _Dec):
            return str(value)
        if isinstance(value, dict):
            return {k: self._sanitize_json(v) for k, v in value.items()}
        if isinstance(value, (list, tuple)):
            return [self._sanitize_json(v) for v in value]
        if isinstance(value, (str, int, float, bool)):
            return value
        return str(value)


import re
