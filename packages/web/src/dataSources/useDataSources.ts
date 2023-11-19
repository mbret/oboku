import { switchMap } from "rxjs"
import { isNotNullOrUndefined } from "../common/isNotNullOrUndefined"
import { useObserve, useSignalValue } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { libraryStateSignal } from "../library/states"

export const useDataSources = () => {
  const { isLibraryUnlocked } = useSignalValue(libraryStateSignal)

  return useObserve(
    () =>
      latestDatabase$.pipe(
        isNotNullOrUndefined(),
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
