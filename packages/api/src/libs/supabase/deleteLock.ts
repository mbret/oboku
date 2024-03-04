import { SupabaseClient } from "@supabase/supabase-js"

export const deleteLock = async (supabase: SupabaseClient, lockId: string) => {
  return await supabase.from("lock").delete().eq("lock_id", lockId)
}
