import { useMutation$ } from "reactjrx"
import { getLatestDatabase } from "../../../rxdb/RxDbProvider"
import { from, switchMap } from "rxjs"
import type { SettingsDocType } from "../../../rxdb/collections/settings"

export const useUpdateConnector = () => {
  return useMutation$({
    mutationFn: ({
      id,
      ...data
    }: NonNullable<SettingsDocType["webdavConnectors"]>[number]) => {
      return getLatestDatabase().pipe(
        switchMap((db) => {
          const dataSource$ = from(db.settings.patchWebdavConnector(id, data))

          return dataSource$
        }),
      )
    },
  })
}
