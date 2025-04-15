import { useMutation$ } from "reactjrx"
import { getLatestDatabase } from "../../../rxdb/RxDbProvider"
import { from, switchMap } from "rxjs"

export const useDeleteConnector = () => {
  return useMutation$({
    mutationFn: ({ id }: { id: string }) => {
      return getLatestDatabase().pipe(
        switchMap((db) => {
          const dataSource$ = from(db.settings.deleteWebdavConnector(id))

          return dataSource$
        }),
      )
    },
  })
}
