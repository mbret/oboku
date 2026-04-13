export const createDurationFromSeconds = (
  totalSeconds: number,
): Intl.DurationInput => {
  const normalizedTotalSeconds = Math.max(0, Math.trunc(totalSeconds))
  const hours = Math.floor(normalizedTotalSeconds / 3600)
  const minutes = Math.floor((normalizedTotalSeconds % 3600) / 60)
  const seconds = normalizedTotalSeconds % 60
  const duration: Intl.DurationInput = {}

  if (hours > 0) {
    duration.hours = hours
  }

  if (minutes > 0) {
    duration.minutes = minutes
  }

  if (seconds > 0) {
    duration.seconds = seconds
  }

  return duration
}
