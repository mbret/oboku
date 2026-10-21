import { useMutation$ } from "reactjrx"
import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { from, of, switchMap } from "rxjs"
import type { RxDocument } from "rxdb"
import type { DefaultError, UseMutationOptions } from "@tanstack/react-query"
import type { BookDocType, DataSourceDocType, LinkData } from "@oboku/shared"

type UpsertLinkVariables = {
  bookId: string
  data: LinkData
  type: DataSourceDocType["type"]
}

export const useUpsertLink = (
  options?: Pick<
    UseMutationOptions<
      RxDocument<BookDocType> | null,
      DefaultError,
      UpsertLinkVariables
    >,
    "onSuccess"
  >,
) => {
  return useMutation$({
    ...options,
    mutationFn: function upsertBookLink({
      bookId,
      data,
      type,
    }: UpsertLinkVariables) {
      return getLatestDatabase().pipe(
        switchMap(function upsertBookLinkInDatabase(db) {
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
            switchMap(function insertLinkUnlessFound(existingLink) {
              if (existingLink) return of(existingLink)

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
            switchMap(function setAsBookLink(link) {
              return from(
                db.book.findOne(bookId).incrementalPatch({ links: [link._id] }),
              )
            }),
          )
        }),
      )
    },
  })
}
