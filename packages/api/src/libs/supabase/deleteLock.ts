import { Logger } from "@libs/logger"
import { SupabaseClient } from "@supabase/supabase-js"

export const deleteLock = async (supabase: SupabaseClient, lockId: string) => {
  Logger.log(`releasing lock ${lockId}`)

  return await supabase.from("lock").delete().eq("lock_id", lockId)
}
