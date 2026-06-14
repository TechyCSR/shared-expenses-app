from datetime import datetime, date
from typing import Optional
import re


DATE_FORMATS = [
    "%Y-%m-%d",
    "%d/%m/%Y",
    "%m/%d/%Y",
    "%d/%m/%y",
    "%m/%d/%y",
    "%b %d",
    "%b %d, %Y",
    "%d %b %Y",
    "%d %b",
]


def parse_date(date_str: str) -> date:
    date_str = date_str.strip()
    for fmt in DATE_FORMATS:
        try:
            parsed = datetime.strptime(date_str, fmt)
            if fmt in ("%b %d", "%d %b"):
                parsed = parsed.replace(year=datetime.now().year)
            return parsed.date()
        except ValueError:
            continue
    raise ValueError(f"Unable to parse date: {date_str}")


def parse_flexible_date(date_str: str) -> tuple[date, bool]:
    date_str = date_str.strip()
    ambiguous = False

    dd_mm_yyyy = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})$", date_str)
    mm_dd_yyyy = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})$", date_str)
    dd_mm_yy = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{2})$", date_str)

    if dd_mm_yyyy:
        day, month, year = int(dd_mm_yyyy.group(1)), int(dd_mm_yyyy.group(2)), int(dd_mm_yyyy.group(3))
        if day <= 12 and month <= 12 and day != month:
            ambiguous = True
        try:
            return date(year, month, day), ambiguous
        except ValueError:
            pass

    if dd_mm_yy:
        day, month, year = int(dd_mm_yy.group(1)), int(dd_mm_yy.group(2)), int(dd_mm_yy.group(3))
        if day <= 12 and month <= 12 and day != month:
            ambiguous = True
        full_year = 2000 + year if year < 50 else 1900 + year
        try:
            return date(full_year, month, day), ambiguous
        except ValueError:
            pass

    try:
        return parse_date(date_str), ambiguous
    except ValueError:
        raise ValueError(f"Unable to parse date: {date_str}")


def is_ambiguous_date(date_str: str) -> bool:
    _, ambiguous = parse_flexible_date(date_str)
    return ambiguous