import { switchMap } from "rxjs"
import { isNotNullOrUndefined } from "../common/isNotNullOrUndefined"
import { useLibraryState } from "../library/states"
import { useObserve } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"

export const useDataSources = () => {
  const { isLibraryUnlocked } = useLibraryState()

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
