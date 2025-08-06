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

    day = date.getDay()
    month = date.getMonth()
    year = date.getFullYear()
  }

  return { year, month, day }
}
