import { useMutation$ } from "reactjrx"
import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { from, switchMap } from "rxjs"
import type {
  SettingsConnectorDocType,
  SettingsConnectorUpdate,
} from "@oboku/shared"

export const useUpdateConnector = <T extends SettingsConnectorDocType["type"]>({
  type,
}: {
  type: T
}) => {
  return useMutation$({
    mutationFn: ({ id, ...data }: SettingsConnectorUpdate<T>) => {
      return getLatestDatabase().pipe(
        switchMap((db) => {
          return from(
            db.settings.patchConnector(id, {
              ...data,
              type,
            }),
          )
        }),
      )
    },
  })
}
