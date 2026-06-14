from decimal import Decimal, ROUND_HALF_UP
from app.config import settings
from app.utils.exceptions import ValidationError


CURRENCY_PRECISION = {
    "INR": 2,
    "USD": 2,
    "EUR": 2,
    "GBP": 2,
    "JPY": 0,
    "BTC": 8,
    "ETH": 8,
}


def validate_currency(currency: str) -> str:
    currency = currency.upper().strip()
    supported = settings.get_supported_currencies_list()
    if currency not in supported:
        raise ValidationError(
            f"Unsupported currency: {currency}",
            details={"supported": supported}
        )
    return currency


def get_currency_precision(currency: str) -> int:
    return CURRENCY_PRECISION.get(currency.upper(), 2)


def normalize_amount(amount: str | float | Decimal, currency: str) -> Decimal:
    if isinstance(amount, str):
        amount = amount.replace(",", "").strip()
    decimal_amount = Decimal(str(amount))
    precision = get_currency_precision(currency)
    quantize_str = "0." + "0" * precision if precision > 0 else "0"
    return decimal_amount.quantize(Decimal(quantize_str), rounding=ROUND_HALF_UP)


def check_excess_precision(amount: str | float | Decimal, currency: str) -> bool:
    if isinstance(amount, (float, Decimal)):
        amount_str = str(amount)
    else:
        amount_str = amount
    if "." in amount_str:
        decimals = len(amount_str.split(".")[1])
        return decimals > get_currency_precision(currency)
    return False


def format_amount(amount: Decimal, currency: str) -> str:
    precision = get_currency_precision(currency)
    if precision == 0:
        return f"{amount:.0f} {currency}"
    return f"{amount:.{precision}f} {currency}"