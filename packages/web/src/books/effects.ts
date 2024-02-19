import {
  EMPTY,
  from,
  switchMap,
  ignoreElements,
  zip,
  catchError,
  tap,
  mergeMap,
  withLatestFrom,
  of,
  filter
} from "rxjs"
import { Report } from "../debug/report.shared"
import { useRemoveDanglingLinks } from "../links/helpers"
import { useDatabase } from "../rxdb"
import {
  markAsInterested$,
  upsertBookLink$,
  upsertBookLinkEnd,
  upsertBookLinkEnd$
} from "./triggers"
import { useRefreshBookMetadata } from "./helpers"
import { isDefined, useSubscribeEffect } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"

const useUpsertBookLinkActionEffect = () => {
  const { db: database } = useDatabase()
  const refreshBookMetadata = useRefreshBookMetadata()
  const removeDanglingLinks = useRemoveDanglingLinks()

  useSubscribeEffect(
    () =>
      upsertBookLink$.pipe(
        switchMap((data) => {
          return from(
            Promise.all([
              database?.link
                .safeFindOne({
                  selector: {
                    resourceId: data.linkResourceId,
                    type: data.linkType,
                    book: data.bookId
                  }
                })
                .exec(),
              database?.book
                .safeFindOne({ selector: { _id: data.bookId } })
                .exec()
            ])
          ).pipe(
            switchMap(([existingLink, book]) => {
              if (existingLink && book?.links.includes(existingLink._id)) {
                Report.log(`This link is already attached to this book`)

                return EMPTY
              }

              if (existingLink && !book?.links.includes(existingLink._id)) {
                Report.warn(
                  `Found a dangling link referencing this book, reattaching it`
                )
                if (book) {
                  return from(
                    book.atomicUpdate((oldData) => ({
                      ...oldData,
                      links: [existingLink._id]
                    }))
                  )
                }
              } else {
                Report.log(`Create new link for book ${data.bookId}`)
                return from(
                  database?.link.safeInsert({
                    data: null,
                    resourceId: data.linkResourceId,
                    type: data.linkType,
                    book: data.bookId,
                    createdAt: new Date().toISOString(),
                    modifiedAt: null
                  }) || EMPTY
                )
              }

              return EMPTY
            }),
            tap(() => {
              upsertBookLinkEnd(data.bookId)
            })
          )
        })
      ),
    [database]
  )

  useSubscribeEffect(
    () =>
      upsertBookLinkEnd$.pipe(
        switchMap((data) =>
          zip(removeDanglingLinks(data), refreshBookMetadata(data))
        ),
        catchError((err) => {
          Report.error(err)

          return EMPTY
        }),
        ignoreElements()
      ),
    [refreshBookMetadata, removeDanglingLinks]
  )

  useSubscribeEffect(
    () =>
      markAsInterested$.pipe(
        mergeMap((action) =>
          of(action).pipe(
            withLatestFrom(latestDatabase$),
            mergeMap(([{ id, isNotInterested }, db]) =>
              from(db.book.safeFindOne({ selector: { _id: id } }).exec()).pipe(
                filter(isDefined),
                switchMap((book) =>
                  from(
                    book.atomicUpdate((data) => ({
                      ...data,
                      isNotInterested
                    }))
                  )
                )
              )
            )
          )
        )
      ),
    []
  )
}

export const useBooksActionEffects = () => {
  useUpsertBookLinkActionEffect()
}
