import { filter, map, switchMap } from "rxjs"
import { isDefined, useForeverQuery, useSignalValue } from "reactjrx"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { libraryStateSignal } from "../library/states"

export const useDataSources = () => {
  const { isLibraryUnlocked } = useSignalValue(libraryStateSignal)

  return useForeverQuery({
    queryKey: ["rxdb", "dataSources", { isLibraryUnlocked }],
    queryFn: () =>
      latestDatabase$.pipe(
        filter(isDefined),
        switchMap((db) => {
          if (isLibraryUnlocked) {
            return db.datasource.find().$
          }

          return db.datasource.find({
            selector: { isProtected: { $ne: true } }
          }).$
        }),
        map((items) => items.map((item) => item.toJSON()))
      )
  })
}
