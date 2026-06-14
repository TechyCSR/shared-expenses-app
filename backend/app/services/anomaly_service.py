import re
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from typing import Optional
from dataclasses import dataclass, field


@dataclass
class AnomalyRule:
    name: str
    severity: str
    description: str
    fields: list[str] = field(default_factory=list)


class AnomalyRegistry:
    RULES: dict[str, AnomalyRule] = {
        "missing_required_field": AnomalyRule(
            "missing_required_field", "error",
            "Required field is missing or empty",
            ["date", "description", "amount", "currency", "paid_by"],
        ),
        "invalid_date_format": AnomalyRule(
            "invalid_date_format", "error",
            "Date format could not be parsed",
            ["date"],
        ),
        "ambiguous_date": AnomalyRule(
            "ambiguous_date", "warning",
            "Date format is ambiguous (DD/MM vs MM/DD)",
            ["date"],
        ),
        "invalid_amount": AnomalyRule(
            "invalid_amount", "error",
            "Amount is invalid (negative, zero, or unparseable)",
            ["amount"],
        ),
        "zero_amount": AnomalyRule(
            "zero_amount", "warning",
            "Amount is zero",
            ["amount"],
        ),
        "negative_amount": AnomalyRule(
            "negative_amount", "warning",
            "Amount is negative (possible refund)",
            ["amount"],
        ),
        "excess_decimal_precision": AnomalyRule(
            "excess_decimal_precision", "warning",
            "Amount has more decimal places than standard for this currency",
            ["amount"],
        ),
        "invalid_currency": AnomalyRule(
            "invalid_currency", "error",
            "Currency code is not recognized or empty",
            ["currency"],
        ),
        "missing_payer": AnomalyRule(
            "missing_payer", "error",
            "Payer (paid_by) is empty",
            ["paid_by"],
        ),
        "unknown_participant": AnomalyRule(
            "unknown_participant", "error",
            "Participant name does not match any group member",
            ["participants", "paid_by"],
        ),
        "name_fuzzy_mismatch": AnomalyRule(
            "name_fuzzy_mismatch", "warning",
            "Name has minor differences from known group members (case, spacing, initials)",
            ["paid_by", "participants"],
        ),
        "duplicate_expense": AnomalyRule(
            "duplicate_expense", "warning",
            "Expense appears to be a duplicate of another row",
            ["date", "description", "amount", "paid_by"],
        ),
        "currency_mismatch_group": AnomalyRule(
            "currency_mismatch_group", "warning",
            "Expense currency differs from group default currency",
            ["currency"],
        ),
        "settlement_as_expense": AnomalyRule(
            "settlement_as_expense", "warning",
            "This looks like a settlement recorded as an expense",
            ["description", "split_type"],
        ),
        "invalid_split_type": AnomalyRule(
            "invalid_split_type", "error",
            "Split type is empty or not recognized",
            ["split_type"],
        ),
        "invalid_percentages": AnomalyRule(
            "invalid_percentages", "error",
            "Percentage values do not sum to 100%",
            ["split_details"],
        ),
        "invalid_shares": AnomalyRule(
            "invalid_shares", "error",
            "Share values are invalid (non-positive or malformed)",
            ["split_details"],
        ),
        "split_details_format_mismatch": AnomalyRule(
            "split_details_format_mismatch", "error",
            "Split details format does not match the split type",
            ["split_type", "split_details"],
        ),
        "membership_timeline_violation": AnomalyRule(
            "membership_timeline_violation", "error",
            "Participant was not a group member on the expense date",
            ["participants", "date"],
        ),
        "data_normalization": AnomalyRule(
            "data_normalization", "info",
            "Data has been normalized (trimmed whitespace, case, etc.)",
            ["all"],
        ),
    }

    @classmethod
    def get_rule(cls, name: str) -> Optional[AnomalyRule]:
        return cls.RULES.get(name)

    @classmethod
    def get_all_rules(cls) -> dict:
        return dict(cls.RULES)


@dataclass
class AnomalyResult:
    row_number: int
    anomaly_type: str
    severity: str
    message: str
    suggested_action: Optional[dict] = None
    raw_row_data: dict = field(default_factory=dict)


class AnomalyDetector:
    def __init__(self, group_members: list[dict], default_currency: str = "INR"):
        self.group_members = group_members
        self.default_currency = default_currency
        self.member_names = self._build_name_map()

    def _build_name_map(self) -> dict:
        name_map = {}
        for member in self.group_members:
            name_lower = member.get("full_name", "").lower().strip()
            if name_lower:
                name_map[name_lower] = member
            name_map[member.get("email", "").lower()] = member
            first_name = member.get("full_name", "").split()[0].lower() if member.get("full_name") else ""
            if first_name:
                name_map[first_name] = member
        return name_map

    def fuzzy_match_name(self, name: str) -> Optional[dict]:
        clean = name.strip().lower()
        clean = re.sub(r"[^a-z0-9\s]", "", clean)
        if clean in self.member_names:
            return self.member_names[clean]

        tokens = clean.split()
        for token in tokens:
            if token in self.member_names:
                return self.member_names[token]
            for key in self.member_names:
                if key.startswith(token) or token.startswith(key):
                    return self.member_names[key]

        return None

    async def detect_anomalies(
        self,
        rows: list[dict],
        existing_expenses: Optional[list[dict]] = None,
    ) -> list[AnomalyResult]:
        anomalies = []
        for idx, row in enumerate(rows, start=1):
            anomalies.extend(self._check_missing_fields(idx, row))
            anomalies.extend(self._check_date(idx, row))
            anomalies.extend(self._check_amount(idx, row))
            anomalies.extend(self._check_currency(idx, row))
            anomalies.extend(self._check_payer(idx, row))
            anomalies.extend(self._check_split_type(idx, row))
            anomalies.extend(self._check_participants(idx, row))
            anomalies.extend(self._check_split_details(idx, row))

        if existing_expenses:
            anomalies.extend(self._check_duplicates(rows, existing_expenses))

        for idx, row in enumerate(rows, start=1):
            row_lower = row.get("description", "").lower()
            if any(kw in row_lower for kw in ["paid back", "settlement", "deposit", "reimbursed"]):
                anomalies.append(AnomalyResult(
                    row_number=idx,
                    anomaly_type="settlement_as_expense",
                    severity="warning",
                    message=f"Row {idx}: '{row.get('description')}' looks like a settlement, not an expense",
                    suggested_action={
                        "type": "convert_to_settlement_or_keep",
                        "options": ["keep_as_expense", "convert_to_settlement", "reject"],
                    },
                    raw_row_data=row,
                ))

        return anomalies

    def _check_missing_fields(self, row_num: int, row: dict) -> list[AnomalyResult]:
        results = []
        required = ["date", "description", "amount"]
        for field in required:
            if not row.get(field) or str(row[field]).strip() == "":
                results.append(AnomalyResult(
                    row_number=row_num,
                    anomaly_type="missing_required_field",
                    severity="error",
                    message=f"Row {row_num}: Required field '{field}' is missing",
                    suggested_action={"field": field, "type": "provide_value"},
                    raw_row_data=row,
                ))
        return results

    def _check_date(self, row_num: int, row: dict) -> list[AnomalyResult]:
        results = []
        raw_date = str(row.get("date", "")).strip()
        if not raw_date:
            return results

        try:
            from app.utils.dates import is_ambiguous_date
            if is_ambiguous_date(raw_date):
                results.append(AnomalyResult(
                    row_number=row_num,
                    anomaly_type="ambiguous_date",
                    severity="warning",
                    message=f"Row {row_num}: Date '{raw_date}' is ambiguous (DD/MM vs MM/DD)",
                    suggested_action={
                        "type": "select_format",
                        "options": ["dd_mm_yyyy", "mm_dd_yyyy"],
                        "raw_value": raw_date,
                    },
                    raw_row_data=row,
                ))
        except Exception:
            results.append(AnomalyResult(
                row_number=row_num,
                anomaly_type="invalid_date_format",
                severity="error",
                message=f"Row {row_num}: Unable to parse date '{raw_date}'",
                suggested_action={"type": "manual_fix", "field": "date"},
                raw_row_data=row,
            ))
        return results

    def _check_amount(self, row_num: int, row: dict) -> list[AnomalyResult]:
        results = []
        raw_amount = str(row.get("amount", "")).strip()
        if not raw_amount:
            return results

        try:
            cleaned = raw_amount.replace(",", "").replace(" ", "")
            amount = Decimal(cleaned)
            if amount == 0:
                results.append(AnomalyResult(
                    row_number=row_num,
                    anomaly_type="zero_amount",
                    severity="warning",
                    message=f"Row {row_num}: Amount is zero",
                    suggested_action={"type": "confirm_or_reject"},
                    raw_row_data=row,
                ))
            elif amount < 0:
                results.append(AnomalyResult(
                    row_number=row_num,
                    anomaly_type="negative_amount",
                    severity="warning",
                    message=f"Row {row_num}: Amount is negative ({amount}) - possible refund",
                    suggested_action={
                        "type": "convert_to_settlement_or_keep",
                        "options": ["keep_as_negative_expense", "convert_to_settlement", "reject"],
                    },
                    raw_row_data=row,
                ))
        except Exception:
            results.append(AnomalyResult(
                row_number=row_num,
                anomaly_type="invalid_amount",
                severity="error",
                message=f"Row {row_num}: Unable to parse amount '{raw_amount}'",
                suggested_action={"type": "manual_fix", "field": "amount"},
                raw_row_data=row,
            ))
        return results

    def _check_currency(self, row_num: int, row: dict) -> list[AnomalyResult]:
        results = []
        raw_currency = str(row.get("currency", "")).strip()
        if not raw_currency:
            results.append(AnomalyResult(
                row_number=row_num,
                anomaly_type="invalid_currency",
                severity="error",
                message=f"Row {row_num}: Currency is empty",
                suggested_action={
                    "type": "select_currency",
                    "options": ["INR", "USD", "EUR", "GBP"],
                    "default": self.default_currency,
                },
                raw_row_data=row,
            ))
        elif raw_currency.upper() != self.default_currency:
            from app.config import settings
            if raw_currency.upper() in settings.SUPPORTED_CURRENCIES:
                results.append(AnomalyResult(
                    row_number=row_num,
                    anomaly_type="currency_mismatch_group",
                    severity="warning",
                    message=f"Row {row_num}: Currency '{raw_currency}' differs from group default '{self.default_currency}'",
                    suggested_action={
                        "type": "keep_or_convert",
                        "options": ["keep_currency", "convert_to_group_default"],
                        "raw_value": raw_currency,
                        "default": self.default_currency,
                    },
                    raw_row_data=row,
                ))
        return results

    def _check_payer(self, row_num: int, row: dict) -> list[AnomalyResult]:
        results = []
        raw_payer = str(row.get("paid_by", "")).strip()
        if not raw_payer:
            results.append(AnomalyResult(
                row_number=row_num,
                anomaly_type="missing_payer",
                severity="error",
                message=f"Row {row_num}: Payer (paid_by) is empty",
                suggested_action={
                    "type": "select_payer",
                    "options": [m.get("full_name") or m.get("email") for m in self.group_members],
                },
                raw_row_data=row,
            ))
            return results

        user = self.fuzzy_match_name(raw_payer)
        if user is None:
            results.append(AnomalyResult(
                row_number=row_num,
                anomaly_type="unknown_participant",
                severity="error",
                message=f"Row {row_num}: Payer '{raw_payer}' does not match any group member",
                suggested_action={
                    "type": "select_payer",
                    "options": [m.get("full_name") or m.get("email") for m in self.group_members],
                },
                raw_row_data=row,
            ))
        else:
            matched_name = user.get("full_name") or user.get("email", "")
            if matched_name.lower() != raw_payer.lower().strip():
                results.append(AnomalyResult(
                    row_number=row_num,
                    anomaly_type="name_fuzzy_mismatch",
                    severity="warning",
                    message=f"Row {row_num}: Payer '{raw_payer}' fuzzy-matched to '{matched_name}'",
                    suggested_action={
                        "type": "confirm_mapping",
                        "raw_value": raw_payer,
                        "mapped_to": user.get("id"),
                        "mapped_name": matched_name,
                    },
                    raw_row_data=row,
                ))
        return results

    def _check_split_type(self, row_num: int, row: dict) -> list[AnomalyResult]:
        results = []
        split_type = str(row.get("split_type", "")).strip().lower()
        valid_types = ["equal", "unequal", "percentage", "share", "shares"]
        if not split_type:
            results.append(AnomalyResult(
                row_number=row_num,
                anomaly_type="invalid_split_type",
                severity="error",
                message=f"Row {row_num}: Split type is empty",
                suggested_action={
                    "type": "select_split_type",
                    "options": valid_types,
                },
                raw_row_data=row,
            ))
        elif split_type not in valid_types:
            results.append(AnomalyResult(
                row_number=row_num,
                anomaly_type="invalid_split_type",
                severity="error",
                message=f"Row {row_num}: Unknown split type '{split_type}'",
                suggested_action={
                    "type": "select_split_type",
                    "options": valid_types,
                },
                raw_row_data=row,
            ))
        return results

    def _check_participants(self, row_num: int, row: dict) -> list[AnomalyResult]:
        results = []
        raw_participants = str(row.get("split_with", "")).strip()
        if not raw_participants:
            return results

        names = [n.strip() for n in raw_participants.split(";")]
        for name in names:
            if not name:
                continue
            user = self.fuzzy_match_name(name)
            if user is None:
                results.append(AnomalyResult(
                    row_number=row_num,
                    anomaly_type="unknown_participant",
                    severity="error",
                    message=f"Row {row_num}: Participant '{name}' does not match any group member",
                    suggested_action={
                        "type": "map_or_reject",
                        "raw_value": name,
                        "options": [m.get("full_name") or m.get("email") for m in self.group_members],
                    },
                    raw_row_data=row,
                ))
            else:
                matched_name = user.get("full_name") or user.get("email", "")
                if matched_name.lower() != name.lower().strip():
                    results.append(AnomalyResult(
                        row_number=row_num,
                        anomaly_type="name_fuzzy_mismatch",
                        severity="warning",
                        message=f"Row {row_num}: Participant '{name}' fuzzy-matched to '{matched_name}'",
                        suggested_action={
                            "type": "confirm_mapping",
                            "raw_value": name,
                            "mapped_to": user.get("id"),
                            "mapped_name": matched_name,
                        },
                        raw_row_data=row,
                    ))
        return results

    def _check_split_details(self, row_num: int, row: dict) -> list[AnomalyResult]:
        results = []
        split_type = str(row.get("split_type", "")).strip().lower()
        raw_details = str(row.get("split_details", "")).strip()
        raw_participants = str(row.get("split_with", "")).strip()
        names = [n.strip() for n in raw_participants.split(";")] if raw_participants else []

        if not raw_details:
            return results

        if split_type == "percentage":
            percentages = re.findall(r"(\d+(?:\.\d+)?)\s*%", raw_details)
            if percentages:
                total = sum(Decimal(p) for p in percentages)
                if total != 100:
                    results.append(AnomalyResult(
                        row_number=row_num,
                        anomaly_type="invalid_percentages",
                        severity="error",
                        message=f"Row {row_num}: Percentages sum to {total}%, must be 100%",
                        suggested_action={"type": "normalize_or_reject"},
                        raw_row_data=row,
                    ))
            else:
                has_shares = re.findall(r"(\d+)", raw_details)
                if has_shares:
                    results.append(AnomalyResult(
                        row_number=row_num,
                        anomaly_type="split_details_format_mismatch",
                        severity="error",
                        message=f"Row {row_num}: Split type is 'percentage' but split_details contain share amounts, not percentages",
                        suggested_action={"type": "fix_split_details"},
                        raw_row_data=row,
                    ))

        elif split_type in ("share", "shares"):
            has_pct = "%" in raw_details
            if has_pct:
                results.append(AnomalyResult(
                    row_number=row_num,
                    anomaly_type="split_details_format_mismatch",
                    severity="error",
                    message=f"Row {row_num}: Split type is '{split_type}' but split_details contain percentages",
                    suggested_action={"type": "fix_split_details"},
                    raw_row_data=row,
                ))
            else:
                shares = re.findall(r"(\d+)", raw_details)
                non_positive = [int(s) for s in shares if int(s) <= 0]
                if non_positive:
                    results.append(AnomalyResult(
                        row_number=row_num,
                        anomaly_type="invalid_shares",
                        severity="error",
                        message=f"Row {row_num}: Share values must be positive integers",
                        suggested_action={"type": "fix_shares"},
                        raw_row_data=row,
                    ))

        elif split_type == "equal":
            has_non_equal = bool(re.findall(r"\d+", raw_details))
            if has_non_equal:
                results.append(AnomalyResult(
                    row_number=row_num,
                    anomaly_type="split_details_format_mismatch",
                    severity="warning",
                    message=f"Row {row_num}: Split type is 'equal' but split_details contain values",
                    suggested_action={"type": "clear_details_or_change_split_type"},
                    raw_row_data=row,
                ))

        return results

    def _check_duplicates(self, rows: list[dict], existing_expenses: list[dict]) -> list[AnomalyResult]:
        results = []
        seen = {}
        for idx, row in enumerate(rows, start=1):
            key = (
                str(row.get("date", "")).strip(),
                str(row.get("description", "")).strip().lower(),
                str(row.get("amount", "")).strip(),
                str(row.get("paid_by", "")).strip().lower(),
            )
            if key in seen:
                results.append(AnomalyResult(
                    row_number=idx,
                    anomaly_type="duplicate_expense",
                    severity="warning",
                    message=f"Row {idx}: Duplicate of row {seen[key]} (same date, description, amount, payer)",
                    suggested_action={
                        "type": "duplicate_action",
                        "options": ["keep_both", "merge", "ignore_duplicate"],
                        "duplicate_of_row": seen[key],
                    },
                    raw_row_data=row,
                ))
            else:
                seen[key] = idx

        for idx, row in enumerate(rows, start=1):
            for existing in existing_expenses:
                desc_sim = self._text_similarity(
                    str(row.get("description", "")).lower(),
                    existing.get("description", "").lower(),
                )
                if (
                    abs(float(row.get("amount", 0)) - float(existing.get("amount", 0))) < 1
                    and desc_sim > 0.7
                ):
                    results.append(AnomalyResult(
                        row_number=idx,
                        anomaly_type="duplicate_expense",
                        severity="warning",
                        message=f"Row {idx}: Similar to existing expense '{existing.get('description')}' ({existing.get('amount')})",
                        suggested_action={
                            "type": "duplicate_action",
                            "options": ["keep_both", "merge", "ignore_duplicate"],
                            "existing_expense_id": existing.get("id"),
                        },
                        raw_row_data=row,
                    ))
                    break
        return results

    def _text_similarity(self, a: str, b: str) -> float:
        if not a or not b:
            return 0.0
        a_words = set(a.split())
        b_words = set(b.split())
        if not a_words or not b_words:
            return 0.0
        intersection = a_words & b_words
        return len(intersection) / max(len(a_words), len(b_words))