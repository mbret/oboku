import { useMutation$ } from "reactjrx"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { first, from, of, switchMap } from "rxjs"
import { Logger } from "../debug/logger.shared"
import type { DataSourceDocType, LinkData } from "@oboku/shared"

export const useUpsertLink = () => {
  return useMutation$({
    mutationFn: ({
      bookId,
      data,
      type,
    }: {
      bookId: string
      data: LinkData
      type: DataSourceDocType["type"]
    }) => {
      return latestDatabase$.pipe(
        first(),
        switchMap((db) => {
          return from(
            db.link
              .findOne({
                selector: {
                  data,
                  type,
                  book: bookId,
                },
              })
              .exec(),
          ).pipe(
            switchMap((existingLink) => {
              if (existingLink) {
                Logger.info("Link already exist, skipping creation")

                return of(null)
              }

              return from(
                db.link.safeInsert({
                  data,
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
