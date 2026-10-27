export function extractDateComponents(dateStr: string | undefined = "") {
  const parts = dateStr.split(" ")
  let day: number | undefined
  let month: number | undefined
  let year: number | undefined

  // Only year is provided
  if (parts.length === 1 && parts[0]?.length === 4) {
    // biome-ignore lint/style/noNonNullAssertion: TODO
    year = parseInt(parts[0]!, 10)
  } else if (!Number.isNaN(Date.parse(dateStr))) {
    const date = new Date(dateStr)

    // Date-only strings parse as UTC midnight, so UTC getters keep the calendar date.
    day = date.getUTCDate()
    month = date.getUTCMonth() + 1
    year = date.getUTCFullYear()
  }

  return { year, month, day }
}
