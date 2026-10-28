export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  const parts = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes % 60 > 0) parts.push(`${minutes % 60}m`)
  if (seconds % 60 > 0) parts.push(`${seconds % 60}s`)

  return parts.length > 0 ? parts.join(" ") : "0s"
}
