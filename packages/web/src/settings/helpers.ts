import { crypto } from "@oboku/shared"
import { useDatabase } from "../rxdb"
import { useQuery } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { switchMap } from "rxjs"

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

export const useAccountSettings = (
  options: {
    enabled?: boolean
  } = {}
) => {
  const data = useQuery({
    queryKey: ["rxdb", "settings"],
    queryFn: () =>
      latestDatabase$.pipe(switchMap((db) => db.settings.findOne().$)),
    /**
     * We always want instant feedback for these settings for the user.
     * Since the query is a live stream the data are always fresh anyway.
     */
    gcTime: Infinity,
    staleTime: Infinity,
    ...options
  })

  return data
}
