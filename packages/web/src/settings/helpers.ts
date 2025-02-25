import { Database } from "../rxdb"
import { useQuery$, useMutation$ } from "reactjrx"
import { getLatestDatabase, latestDatabase$ } from "../rxdb/RxDbProvider"
import { from, map, mergeMap, switchMap } from "rxjs"
import { SettingsDocType } from "../rxdb/collections/settings"
import { getSettingsDocument } from "./dbHelpers"
import { hashContentPassword } from "../common/crypto"

const getSettingsOrThrow = (database: Database) => {
  return getSettingsDocument(database).pipe(
    map((settings) => {
      if (!settings) {
        throw new Error("Settings not found")
      }

      return settings
    }),
  )
}

export const useUpdateContentPassword = () => {
  const { mutate: updateSettings } = useUpdateSettings()

  return async (password: string) => {
    const hashed = await hashContentPassword(password)

    updateSettings({
      contentPassword: hashed,
    })
  }
}

export const useValidateAppPassword = (options: {
  onSuccess: () => void
  onError: () => void
}) => {
  return useMutation$({
    ...options,
    mutationFn: (input: string) => {
      if (!input) throw new Error("Invalid password")

      return getLatestDatabase().pipe(
        mergeMap((database) => getSettingsOrThrow(database)),
        mergeMap((settings) =>
          from(hashContentPassword(input)).pipe(
            map((hashedInput) => {
              if (hashedInput !== settings.contentPassword) {
                throw new Error("Invalid password")
              }

              return null
            }),
          ),
        ),
      )
    },
  })
}

export const useSettings = (
  options: {
    enabled?: boolean
  } = {},
) => {
  const data = useQuery$({
    queryKey: ["rxdb", "settings"],
    queryFn: () =>
      latestDatabase$.pipe(
        switchMap((db) =>
          db.settings.findOne().$.pipe(map((entry) => entry?.toJSON())),
        ),
      ),
    /**
     * We always want instant feedback for these settings for the user.
     * Since the query is a live stream the data are always fresh anyway.
     */
    gcTime: Infinity,
    staleTime: Infinity,
    ...options,
  })

  return data
}

export const useUpdateSettings = () => {
  return useMutation$({
    mutationFn: (data: Partial<SettingsDocType>) =>
      getLatestDatabase().pipe(
        mergeMap((database) => getSettingsOrThrow(database)),
        mergeMap((settings) =>
          from(
            settings?.update({
              $set: data,
            }),
          ),
        ),
      ),
  })
}
