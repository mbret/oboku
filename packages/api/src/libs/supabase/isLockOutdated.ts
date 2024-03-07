import { Lock } from "./types"

export const isLockOutdated = (lock: Lock, maximumTime: number) => {
  const created_at = new Date(lock.created_at)
  const now = new Date()
  const differenceInMilliseconds = now.getTime() - created_at.getTime()
  const differenceInMinutes = Math.floor(differenceInMilliseconds / (1000 * 60))

  return differenceInMinutes > maximumTime
}
