import { filter, switchMap } from "rxjs"
import { isDefined, useObserve, useSignalValue } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { libraryStateSignal } from "../library/states"

export const useDataSources = () => {
  const { isLibraryUnlocked } = useSignalValue(libraryStateSignal)

  return useObserve(
    () =>
      latestDatabase$.pipe(
        filter(isDefined),
        switchMap((db) => {
          if (isLibraryUnlocked) {
            return db.datasource.find().$
          }

          return db.datasource.find({
            selector: { isProtected: { $ne: true } }
          }).$
        })
      ),
    [isLibraryUnlocked]
  )
}
