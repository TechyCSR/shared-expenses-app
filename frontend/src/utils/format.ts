/**
 * Format a number/decimal value as a clean amount string.
 * Removes trailing zeros and unnecessary decimal points.
 * 
 * Examples:
 *   "45.0000" -> "45"
 *   "45.50" -> "45.5"
 *   "45.1234" -> "45.1234"
 *   "100" -> "100"
 */
export function formatAmount(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "0"
  
  const num = typeof value === "string" ? parseFloat(value) : value
  if (isNaN(num)) return "0"
  
  return num.toString()
}

/**
 * Format amount with currency symbol
 */
export function formatAmountWithCurrency(
  value: string | number | null | undefined,
  currency: string
): string {
  return `${formatAmount(value)} ${currency}`
}