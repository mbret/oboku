import { crypto } from "@oboku/shared"
import { Database } from "../rxdb"
import { useForeverQuery, useMutation } from "reactjrx"
import { getLatestDatabase, latestDatabase$ } from "../rxdb/RxDbProvider"
import { from, map, mergeMap, of, switchMap } from "rxjs"
import { SettingsDocType } from "../rxdb/collections/settings"
import { getSettingsDocument } from "./dbHelpers"

export const getSettingsOrThrow = (database: Database) => {
  return getSettingsDocument(database).pipe(
    map((settings) => {
      if (!settings) {
        throw new Error("Settings not found")
      }

      return settings
    })
  )
}

export const useUpdateContentPassword = () => {
  const { mutate: updateSettings } = useUpdateSettings()

  return (password: string) => {
    const hashed = crypto.hashContentPassword(password)

    updateSettings({
      contentPassword: hashed
    })
  }
}

export const useValidateAppPassword = (options: {
  onSuccess: () => void
  onError: () => void
}) => {
  return useMutation({
    ...options,
    mapOperator: "switch",
    mutationFn: (input: string) => {
      if (!input) throw new Error("Invalid password")

      return getLatestDatabase().pipe(
        mergeMap((database) => getSettingsOrThrow(database)),
        mergeMap((settings) => {
          const hashedInput = crypto.hashContentPassword(input)

          if (hashedInput !== settings.contentPassword) {
            throw new Error("Invalid password")
          }

          return of(null)
        })
      )
    }
  })
}

export const useSettings = (
  options: {
    enabled?: boolean
  } = {}
) => {
  const data = useForeverQuery({
    queryKey: ["rxdb", "settings"],
    queryFn: () =>
      latestDatabase$.pipe(
        switchMap((db) =>
          db.settings.findOne().$.pipe(map((entry) => entry?.toJSON()))
        )
      ),
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

export const useUpdateSettings = () => {
  return useMutation({
    mutationFn: (data: Partial<SettingsDocType>) =>
      getLatestDatabase().pipe(
        mergeMap((database) => getSettingsOrThrow(database)),
        mergeMap((settings) =>
          from(
            settings?.update({
              $set: data
            })
          )
        )
      )
  })
}
