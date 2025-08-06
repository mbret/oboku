import { useMutation$ } from "reactjrx"
import { from, switchMap } from "rxjs"
import { getLatestDatabase } from "../../../rxdb/RxDbProvider"

export const useAddConnector = () => {
  return useMutation$({
    mutationFn: (connector: {
      url: string
      username: string
      passwordAsSecretId: string
    }) => {
      return getLatestDatabase().pipe(
        switchMap((db) => {
          const dataSource$ = from(db.settings.postWebdavConnector(connector))

          return dataSource$
        }),
      )
    },
  })
}
