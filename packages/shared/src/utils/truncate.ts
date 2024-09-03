export function truncate(
  str: string | null | undefined,
  {
    length,
    omission = "..."
  }: {
    length: number
    omission?: string
  }
): string {
  if (str === null || str === undefined) return ``

  // Handle edge cases for non-positive maxLength
  if (length <= 0) return ""

  // Return the original string if it's shorter or equal to the maximum length
  if (str.length <= length) return str

  // Calculate the effective length to truncate
  const truncatedLength = length - 1

  // Ensure we do not get negative length and return the truncated string with omission
  return truncatedLength > 0
    ? str.slice(0, truncatedLength) + omission
    : omission
}
