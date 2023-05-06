import { crypto } from "@oboku/shared"
import { useDatabase } from "../rxdb"
import { useQuery } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { switchMap } from "rxjs"
import { useState } from "react"

export const useUpdateContentPassword = () => {
  const { db } = useDatabase()

  return async (password: string) => {
    const hashed = await crypto.hashContentPassword(password)

    await db?.settings.safeUpdate(
      { $set: { contentPassword: hashed } },
      (collection) => collection.findOne()
    )
  }
}

export const useAccountSettings = (options: {
  enabled?: boolean
  onSuccess?: () => void
}) => {
  const data = useQuery(
    ["rxdb", "settings"],
    () => latestDatabase$.pipe(switchMap((db) => db.settings.findOne().$)),
    {
      /**
       * We always want instant feedback for these settings for the user.
       * Since the query is a live stream the data are always fresh anyway.
       */
      cacheTime: Infinity,
      ...options
    }
  )

  return data
}

export const usePrefetchAccountSettings = () => {
  const [prefetched, setPrefetched] = useState(false)

  useAccountSettings({
    enabled: !prefetched,
    onSuccess: () => {
      setPrefetched(true)
    }
  })

  return prefetched
}
