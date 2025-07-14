import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { catchError, combineLatest, from, map, mergeMap, of, tap } from "rxjs"
import { useLock } from "../common/BlockingBackdrop"
import { useWithAuthorization } from "../auth/AuthorizeActionDialog"
import { Logger } from "../debug/logger.shared"
import { createDialog } from "../common/dialogs/createDialog"
import { CancelError } from "../errors/errors.shared"
import { useMutation$ } from "reactjrx"

export const useRemoveAllContents = () => {
  // const { mutateAsync: sync } = useSyncReplicate()
  const [lock] = useLock()
  const withAuthorization = useWithAuthorization()

  return useMutation$({
    mutationFn: () =>
      getLatestDatabase().pipe(
        mergeMap((db) =>
          combineLatest([
            of(db),
            from(db.book.count().exec()),
            from(db.obokucollection.count().exec()),
            from(db.tag.count().exec()),
            from(db.datasource.count().exec()),
          ]),
        ),
        mergeMap(
          ([
            database,
            bookCount,
            collectionCount,
            tagCount,
            dataSourceCount,
          ]) => {
            const confirmed$ = createDialog({
              title: "Account reset",
              content: `This action will remove all of your content. Here is a breakdown of everything that will be removed:\n 
            ${bookCount} books, ${collectionCount} collections, ${tagCount} tags and ${dataSourceCount} data sources. \n\nThis operation can take a long time and you NEED to be connected to internet`,
              canEscape: true,
              cancellable: true,
            }).$

            return confirmed$.pipe(
              withAuthorization,
              map(() => lock()),
              mergeMap((unlock) =>
                of(null).pipe(
                  mergeMap(() => {
                    Logger.info("Removing books")

                    return from(database.book.find().incrementalRemove())
                  }),
                  mergeMap(() => {
                    Logger.info("Removing collections")

                    return from(
                      database.obokucollection.find().incrementalRemove(),
                    )
                  }),
                  mergeMap(() => {
                    Logger.info("Removing links")

                    return from(database.link.find().incrementalRemove())
                  }),
                  mergeMap(() => {
                    Logger.info("Removing tags")

                    return from(database.tag.find().incrementalRemove())
                  }),
                  // mergeMap(() =>
                  //   from(database.datasource.find().incrementalRemove()),
                  // ),
                  catchError((e) => {
                    unlock()

                    throw e
                  }),
                ),
              ),
            )
          },
        ),
        tap(() => {
          window.location.reload()
        }),
        catchError((e) => {
          if (e instanceof CancelError) return of(null)

          Logger.error(e)

          createDialog({
            autoStart: true,
            title: "Something went wrong!",
            content:
              "Something went wrong during the process. No need to panic since you already wanted to destroy everything anyway. If everything is gone, you should not worry too much, if you still have contents, try to do it again",
          })

          throw e
        }),
      ),
  })
}
