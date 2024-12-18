import { Logger } from "@libs/logger"
import { SupabaseClient } from "@supabase/supabase-js"
import {
  catchError,
  from,
  ignoreElements,
  map,
  Observable,
  switchMap,
  tap
} from "rxjs"

export const deleteLock = async (supabase: SupabaseClient, lockId: string) => {
  Logger.info(`releasing lock ${lockId}`)

  const response = await supabase.from("lock").delete().eq("lock_id", lockId)

  if (response.error) {
    Logger.error(response.error)
  }
}

export const withDeleteLock =
  <T>(supabase: SupabaseClient, lockId: string) =>
  (stream: Observable<T>) => {
    return stream.pipe(
      switchMap((value) =>
        from(deleteLock(supabase, lockId)).pipe(map(() => value))
      ),
      catchError((error) =>
        from(deleteLock(supabase, lockId)).pipe(
          tap(() => {
            throw error
          }),
          ignoreElements()
        )
      )
    )
  }
