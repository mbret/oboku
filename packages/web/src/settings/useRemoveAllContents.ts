import { useMutation } from "reactjrx"
import { getLatestDatabase } from "../rxdb/useCreateDatabase"
import { catchError, from, mergeMap, tap } from "rxjs"
import { useSync } from "../rxdb/useSync"
import { useLock } from "../common/BlockingBackdrop"

export const useRemoveAllContents = () => {
  const sync = useSync()
  const [lock] = useLock()

  return useMutation({
    onMutate: () => {
      lock()
    },
    mutationFn: () =>
      getLatestDatabase().pipe(
        mergeMap((database) =>
          from(
            Promise.all([
              database.book.find().remove(),
              database.obokucollection.find().remove(),
              database.link.find().remove(),
              database.tag.find().remove(),
              database.datasource.remove()
            ])
          ).pipe(
            mergeMap(() =>
              sync([
                database.book,
                database.obokucollection,
                database.link,
                database.tag,
                database.datasource
              ])
            )
          )
        ),
        tap(() => {
          window.location.reload()
        }),
        catchError((e) => {
          console.error(e)

          throw e
        })
      )
  })
}
