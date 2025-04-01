import { useMutation$ } from "reactjrx"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { first, from, of, switchMap } from "rxjs"
import { Logger } from "../debug/logger.shared"

export const useUpsertLink = () => {
  return useMutation$({
    mutationFn: ({
      bookId,
      resourceId,
      type,
    }: {
      bookId: string
      resourceId: string
      type: string
    }) => {
      return latestDatabase$.pipe(
        first(),
        switchMap((db) => {
          return from(
            db.link
              .findOne({
                selector: {
                  resourceId,
                  type,
                  book: bookId,
                },
              })
              .exec(),
          ).pipe(
            switchMap((existingLink) => {
              if (existingLink) {
                Logger.info(`Link already exist, skipping creation`)

                return of(null)
              }

              return from(
                db.link.safeInsert({
                  data: null,
                  resourceId,
                  type,
                  book: bookId,
                  createdAt: new Date().toISOString(),
                  modifiedAt: null,
                }),
              )
            }),
          )
        }),
      )
    },
  })
}
