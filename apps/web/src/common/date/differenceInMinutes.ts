import { getTimestamp } from "./getTimestamp"

const MINUTE_IN_MILLISECONDS = 60_000

export const differenceInMinutes = (
  left: Date | number | string,
  right: Date | number | string,
) =>
  Math.trunc(
    (getTimestamp(left) - getTimestamp(right)) / MINUTE_IN_MILLISECONDS,
  )
