import { Logger } from "@libs/logger"
import { supabase } from "./client"
import { isLockOutdated } from "./isLockOutdated"

export const lock = async (
  lockId: string,
  maxDuration: number
): Promise<{ alreadyLocked: boolean }> => {
  const response = await supabase
    .from("lock")
    .insert({ lock_id: lockId })
    .select()

  if (response.status === 409) {
    const response = await supabase.from("lock").select().eq("lock_id", lockId)
    const item = (response.data ?? [])[0]

    if (!item) {
      Logger.info(
        `${lockId} not found after receiving 409. Invalid state, ignoring invocation`
      )

      return { alreadyLocked: true }
    }

    const lock = (response.data ?? [])[0]
    const now = new Date()

    if (isLockOutdated(lock, maxDuration)) {
      Logger.info(`${lockId} lock is assumed lost and will be recreated`)

      const updatedResponse = await supabase
        .from("lock")
        .upsert({ id: lock.id, created_at: now, lock_id: lockId })
        .select()

      if (updatedResponse.status === 200) {
        Logger.info(`${lockId} lock correctly updated, command will be sent`)

        return { alreadyLocked: false }
      }
    } else {
      Logger.info(`${lockId} invocation is ignored`)

      return { alreadyLocked: true }
    }
  }

  if (response.status === 201) {
    Logger.info(
      `New lock created for ${lockId} with id ${(response.data ?? [])[0].id}. Command will be sent`
    )

    return { alreadyLocked: false }
  }

  if (response.error) {
    throw response.error
  }

  return { alreadyLocked: true }
}
