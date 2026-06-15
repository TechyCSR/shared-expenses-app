import csv
import io
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

        result = self.session.execute(
            select(ImportAnomaly).where(
                ImportAnomaly.import_job_id == job_id,
                ImportAnomaly.user_decision.is_(None),
            )
        )
        anomalies = result.scalars().all()
        for a in anomalies:
            a.user_decision = decision
            a.resolved_at = datetime.utcnow()
        self.session.flush()
        return len(anomalies)

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
        error_anomalies = self.session.execute(
            select(ImportAnomaly).where(
                ImportAnomaly.import_job_id == job_id,
                ImportAnomaly.user_decision == "reject",
            )
        )
        rejected_rows = {a.row_number for a in error_anomalies.scalars().all()}

        for idx, row in enumerate(rows, start=1):
            if idx in rejected_rows:
                rejected += 1
                continue

            try:
                expense_date, _ = parse_flexible_date(str(row.get("date", "")))
                raw_amount = str(row.get("amount", "")).replace(",", "").replace(" ", "").strip()
                amount = Decimal(raw_amount)
                if amount <= 0:
                    rejected += 1
                    continue

                currency = str(row.get("currency", "")).strip().upper() or "INR"
                description = str(row.get("description", "")).strip()
                payer_name = str(row.get("paid_by", "")).strip().lower()
                split_type = str(row.get("split_type", "")).strip().lower() or "equal"

                payer = member_map.get(payer_name) if payer_name else None
                if not payer:
                    for k, v in member_map.items():
                        if payer_name in k or any(payer_name.startswith(tok) for tok in k.split()):
                            payer = v
                            break
                if not payer:
                    rejected += 1
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
                    continue

                expense = Expense(
                    group_id=job.group_id,
                    paid_by=payer["id"],
                    amount=abs(amount),
                    currency=currency,
                    description=description,
                    expense_date=expense_date,
                    split_type=split_type,
                    notes=row.get("notes", "").strip() or None,
                    created_by=job.uploaded_by,
                )
                self.session.add(expense)
                self.session.flush()

                if split_type == "equal":
                    share_amount = (abs(amount) / len(participants)).quantize(Decimal("0.01"))
                    for p in participants:
                        self.session.add(ExpenseParticipant(
                            expense_id=expense.id,
                            user_id=p["id"],
                            amount_owed=share_amount,
                        ))
                    remainder = abs(amount) - (share_amount * len(participants))
                    if remainder > 0:
                        expense_participants_result = self.session.execute(
                            select(ExpenseParticipant).where(
                                ExpenseParticipant.expense_id == expense.id
                            ).limit(1)
                        )
                        first_p = expense_participants_result.scalar_one_or_none()

                elif split_type == "shares":
                    if split_details_str:
                        share_parts = re.findall(r"(\d+)", split_details_str)
                        total_shares = sum(int(s) for s in share_parts)
                        if total_shares > 0:
                            for i, p in enumerate(participants):
                                s = int(share_parts[i]) if i < len(share_parts) else 1
                                owed = (abs(amount) * s / total_shares).quantize(Decimal("0.01"))
                                self.session.add(ExpenseParticipant(
                                    expense_id=expense.id,
                                    user_id=p["id"],
                                    share_value=Decimal(s),
                                    amount_owed=owed,
                                ))

                elif split_type == "percentage":
                    if split_details_str:
                        pct_parts = re.findall(r"(\d+(?:\.\d+)?)\s*%", split_details_str)
                        if pct_parts:
                            total_pct = sum(Decimal(p) for p in pct_parts)
                            if total_pct > 0:
                                for i, p in enumerate(participants):
                                    pct = Decimal(pct_parts[i]) if i < len(pct_parts) else Decimal(0)
                                    owed = (abs(amount) * pct / total_pct).quantize(Decimal("0.01"))
                                    self.session.add(ExpenseParticipant(
                                        expense_id=expense.id,
                                        user_id=p["id"],
                                        share_value=pct,
                                        amount_owed=owed,
                                    ))

                else:
                    share_amount = (abs(amount) / len(participants)).quantize(Decimal("0.01"))
                    for p in participants:
                        self.session.add(ExpenseParticipant(
                            expense_id=expense.id,
                            user_id=p["id"],
                            amount_owed=share_amount,
                        ))

                imported += 1
            except Exception:
                rejected += 1
                continue

        job.imported_rows = imported
        job.rejected_rows = rejected
        job.status = "completed"
        job.completed_at = datetime.utcnow()

        # Build comprehensive report data with all anomaly details
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
                "generated_at": datetime.utcnow().isoformat(),
            },
        )
        self.session.add(report)
        self.session.flush()
        return job

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
        rejected = sum(1 for a in anomalies if a.user_decision == "reject")
        unresolved = sum(1 for a in anomalies if a.user_decision is None)
        lines.append(f"| User decisions (approve / reject / unresolved) | {approved} / {rejected} / {unresolved} |")
        lines.append("")

        if anomalies:
            lines.append("## Anomalies Detected")
            lines.append("")
            lines.append("| # | Row | Type | Severity | Message | Action Taken |")
            lines.append("|---|----:|------|----------|---------|--------------|")
            for i, a in enumerate(anomalies, start=1):
                sev = a.severity.upper()
                decision = a.user_decision.upper() if a.user_decision else "UNRESOLVED"
                msg = a.message.replace("|", "\\|").replace("\n", " ")
                lines.append(f"| {i} | {a.row_number} | `{a.anomaly_type}` | **{sev}** | {msg} | {decision} |")
            lines.append("")

            # Detailed breakdown
            lines.append("## Detailed Anomaly Breakdown")
            lines.append("")
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
                    lines.append(f"  {a.suggested_action}")
                    lines.append("  ```")
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

    def get_report(self, job_id: uuid.UUID) -> ImportReport:
        result = self.session.execute(
            select(ImportReport).where(ImportReport.import_job_id == job_id)
        )
        report = result.scalar_one_or_none()
        if not report:
            raise NotFoundError("Report not found")
        return report

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


import re