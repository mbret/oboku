import { useMutation } from "reactjrx"
import { getLatestDatabase } from "../rxdb/useCreateDatabase"
import { catchError, combineLatest, from, map, mergeMap, of, tap } from "rxjs"
import { useSyncReplicate } from "../rxdb/replication/useSyncReplicate"
import { useLock } from "../common/BlockingBackdrop"
import { withAuthorization } from "../auth/AuthorizeActionDialog"
import { Report } from "../debug/report.shared"
import { CancelError } from "../common/errors/errors"
import { createDialog } from "../common/dialogs/createDialog"

export const useRemoveAllContents = () => {
  const { mutateAsync: sync } = useSyncReplicate()
  const [lock] = useLock()

  return useMutation({
    mutationFn: () =>
      getLatestDatabase().pipe(
        mergeMap((db) =>
          combineLatest([
            of(db),
            from(db.book.count().exec()),
            from(db.obokucollection.count().exec()),
            from(db.tag.count().exec()),
            from(db.datasource.count().exec())
          ])
        ),
        mergeMap(
          ([
            database,
            bookCount,
            collectionCount,
            tagCount,
            dataSourceCount
          ]) => {
            const confirmed$ = createDialog({
              title: "Account reset",
              content: `This action will remove all of your content. Here is a breakdown of everything that will be removed:\n 
            ${bookCount} books, ${collectionCount} collections, ${tagCount} tags and ${dataSourceCount} data sources. \n\nThis operation can take a long time and you NEED to be connected to internet`,
              canEscape: true,
              cancellable: true
            }).$

            return confirmed$.pipe(
              withAuthorization,
              map(() => lock()),
              mergeMap((unlock) =>
                from(
                  Promise.all([
                    database.book.find().remove(),
                    database.obokucollection.find().remove(),
                    database.link.find().remove(),
                    database.tag.find().remove(),
                    database.datasource.find().remove()
                  ])
                ).pipe(
                  mergeMap(() =>
                    from(
                      sync([
                        database.book,
                        database.obokucollection,
                        database.link,
                        database.tag,
                        database.datasource
                      ])
                    )
                  ),
                  catchError((e) => {
                    unlock()

                    throw e
                  })
                )
              )
            )
          }
        ),
        tap(() => {
          window.location.reload()
        }),
        catchError((e) => {
          if (e instanceof CancelError) return of(null)

          Report.error(e)

          createDialog({
            title: "Something went wrong!",
            content:
              "Something went wrong during the process. No need to panic since you already wanted to destroy everything anyway. If everything is gone, you should not worry too much, if you still have contents, try to do it again"
          })

          throw e
        })
      )
  })
}
