import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { defaultIfEmpty, filter, first, from, mergeMap } from "rxjs"
import { withDialog } from "../common/dialogs/withDialog"
import { createConfirmDialogOptions } from "../common/dialogs/presets"
import { observeLibrarySyncById } from "./dbHelpers"
import { withUnknownErrorDialog } from "../errors/withUnknownErrorDialog"
import { useMutation$ } from "reactjrx"

export const useRemoveLibrarySync = () => {
  return useMutation$({
    mutationFn: ({ id }: { id: string }) =>
      getLatestDatabase().pipe(
        withDialog(createConfirmDialogOptions()),
        filter(([, isConfirmed]) => isConfirmed === true),
        mergeMap(([db]) =>
          observeLibrarySyncById(db, id).pipe(
            first(),
            mergeMap((librarySync) => {
              if (!librarySync) throw new Error("Invalid library sync")
              return from(librarySync.remove())
            }),
          ),
        ),
        withUnknownErrorDialog(),
        defaultIfEmpty(null),
      ),
  })
}
