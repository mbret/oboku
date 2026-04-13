import { getTimestamp } from "./getTimestamp"

const SECOND_IN_MILLISECONDS = 1000

export const addSeconds = (value: Date | number | string, seconds: number) =>
  new Date(getTimestamp(value) + seconds * SECOND_IN_MILLISECONDS)
