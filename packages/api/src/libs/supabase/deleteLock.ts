import { Logger } from "@libs/logger"
import { SupabaseClient } from "@supabase/supabase-js"

export const deleteLock = async (supabase: SupabaseClient, lockId: string) => {
  Logger.info(`releasing lock ${lockId}`)

  const response = await supabase.from("lock").delete().eq("lock_id", lockId)

  if (response.error) {
    Logger.error(response.error)
  }
}
