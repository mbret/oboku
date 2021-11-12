import { EMPTY, from, switchMap, map, mergeMap, ignoreElements, zip, catchError } from "rxjs";
import { ofType, useActionEffect } from "../actions";
import { Report } from "../debug/report";
import { useRemoveDanglingLinks } from "../links/helpers";
import { useDatabase } from "../rxdb";
import { useRefreshBookMetadata } from "./helpers";

const useUpsertBookLinkActionEffect = () => {
  const database = useDatabase()
  const refreshBookMetadata = useRefreshBookMetadata()
  const removeDanglingLinks = useRemoveDanglingLinks()

  useActionEffect(action$ =>
    action$
      .pipe(
        ofType(`UPSERT_BOOK_LINK`),
        switchMap((action) => {
          return from(
            Promise.all([
              database?.link.safeFindOne({
                selector: {
                  resourceId: action.data.linkResourceId,
                  type: action.data.linkType,
                  book: action.data.bookId,
                }
              }).exec(),
              database?.book.safeFindOne({ selector: { _id: action.data.bookId } }).exec()
            ])
          ).pipe(
            switchMap(([existingLink, book]) => {
              if (existingLink && book?.links.includes(existingLink._id)) {
                Report.log(`This link is already attached to this book`)

                return EMPTY
              }

              if (existingLink && !book?.links.includes(existingLink._id)) {
                Report.warn(`Found a dangling link referencing this book, reattaching it`)
                if (book) {
                  return from(book.atomicUpdate(oldData => ({
                    ...oldData,
                    links: [existingLink._id]
                  })))
                }
              } else {
                Report.log(`Create new link for book ${action.data.bookId}`)
                return from(database?.link.safeInsert({
                  data: null,
                  resourceId: action.data.linkResourceId,
                  type: action.data.linkType,
                  book: action.data.bookId,
                  createdAt: new Date().toISOString(),
                  modifiedAt: null,
                }) || EMPTY)
              }

              return EMPTY
            }),
            map(() => ({
              type: `UPSERT_BOOK_LINK_END` as const,
              data: action.data.bookId
            }))
          )
        })
      ),
    [database])

  useActionEffect(action$ =>
    action$
      .pipe(
        ofType(`UPSERT_BOOK_LINK_END`),
        switchMap(({ data }) =>
          zip(removeDanglingLinks(data), refreshBookMetadata(data))
        ),
        catchError(err => {
          Report.error(err)

          return EMPTY
        }),
        ignoreElements()
      )
    , [refreshBookMetadata])
}

export const useBooksActionEffect = () => {
  useUpsertBookLinkActionEffect()
}