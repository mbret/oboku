import { useEffect } from "react"
import {
  EMPTY,
  from,
  switchMap,
  map,
  ignoreElements,
  zip,
  catchError,
  tap,
  mergeMap,
  filter,
  withLatestFrom,
  of,
  Observable,
  take
} from "rxjs"
import { effect } from "../common/rxjs/effect"
import { isNotNullOrUndefined } from "../common/rxjs/isNotNullOrUndefined"
import { Report } from "../debug/report.shared"
import { useRemoveDanglingLinks } from "../links/helpers"
import { useDatabase } from "../rxdb"
import {
  markAsNotInterested$,
  upsertBookLink$,
  upsertBookLinkEnd,
  upsertBookLinkEnd$
} from "./actions"
import { useRefreshBookMetadata } from "./helpers"

const useUpsertBookLinkActionEffect = () => {
  const { db: database } = useDatabase()
  const refreshBookMetadata = useRefreshBookMetadata()
  const removeDanglingLinks = useRemoveDanglingLinks()

  useEffect(() => {
    const subscription = upsertBookLink$
      .pipe(
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
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [database])

  useEffect(() => {
    const subscription = upsertBookLinkEnd$
      .pipe(
        switchMap((data) =>
          zip(removeDanglingLinks(data), refreshBookMetadata(data))
        ),
        catchError((err) => {
          Report.error(err)

          return EMPTY
        }),
        ignoreElements()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [refreshBookMetadata, removeDanglingLinks])

  useEffect(
    () =>
      effect(markAsNotInterested$, (action$) =>
        action$.pipe(
          mergeMap((action) =>
            of(action).pipe(
              withLatestFrom(of(database).pipe(isNotNullOrUndefined())),
              mergeMap(([id, db]) =>
                from(
                  db.book.safeFindOne({ selector: { _id: id } }).exec()
                ).pipe(
                  isNotNullOrUndefined(),
                  switchMap((book) =>
                    from(
                      book.atomicUpdate((data) => ({
                        ...data,
                        isNotInterested: true
                      }))
                    )
                  )
                )
              )
            )
          )
        )
      ),
    [database]
  )
}

export const useBooksActionEffects = () => {
  useUpsertBookLinkActionEffect()
}
