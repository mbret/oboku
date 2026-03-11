import { useMutation$ } from "reactjrx"
import { from, switchMap } from "rxjs"
import { getLatestDatabase } from "../rxdb/RxDbProvider"
import type {
  SettingsConnectorDocType,
  SettingsConnectorInput,
} from "@oboku/shared"

export const useAddConnector = <T extends SettingsConnectorDocType["type"]>({
  type,
}: {
  type: T
}) => {
  return useMutation$({
    mutationFn: (connector: SettingsConnectorInput<T>) => {
      return getLatestDatabase().pipe(
        switchMap((db) => {
          return from(
            db.settings.postConnector({
              ...connector,
              type,
            } as Omit<SettingsConnectorDocType, "id">),
          )
        }),
      )
    },
  })
}
