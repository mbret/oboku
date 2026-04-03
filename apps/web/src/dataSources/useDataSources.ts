import { filter, map, switchMap } from "rxjs"
import { isDefined, useQuery$, useSignalValue } from "reactjrx"
import { RXDB_QUERY_KEY_PREFIX } from "../queries/queryClient"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { libraryStateSignal } from "../library/books/states"

export const useDataSources = () => {
  const { isLibraryUnlocked } = useSignalValue(libraryStateSignal)

  return useQuery$({
    queryKey: [RXDB_QUERY_KEY_PREFIX, "dataSources", { isLibraryUnlocked }],
    queryFn: () =>
      latestDatabase$.pipe(
        filter(isDefined),
        switchMap((db) => {
          if (isLibraryUnlocked) {
            return db.datasource.find().$
          }

          return db.datasource.find({
            selector: { isProtected: { $ne: true } },
          }).$
        }),
        map((items) => items.map((item) => item.toJSON())),
      ),
  })
}
