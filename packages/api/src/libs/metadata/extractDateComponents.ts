export function extractDateComponents(dateStr: string | undefined = "") {
  const parts = dateStr.split(" ")
  let day = undefined,
    month = undefined,
    year = undefined

  // Only year is provided
  if (parts.length === 1 && parts[0]?.length === 4) {
    year = parseInt(parts[0]!, 10)
  } else if (!isNaN(Date.parse(dateStr))) {
    const date = new Date(dateStr)

    day = date.getDay()
    month = date.getMonth()
    year = date.getFullYear()
  }

  return { year, month, day }
}
