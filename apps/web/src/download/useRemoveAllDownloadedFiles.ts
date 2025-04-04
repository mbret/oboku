import { useRemoveDownloadFile } from "./useRemoveDownloadFile"
import { plugin as localPlugin } from "../plugins/local"
import {
  combineLatest,
  combineLatestWith,
  defaultIfEmpty,
  first,
  from,
  map,
  of,
  switchMap,
} from "rxjs"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { dexieDb } from "../rxdb/dexie"
import { useMutation$ } from "reactjrx"

export const useRemoveAllDownloadedFiles = () => {
  const { mutateAsync: removeDownloadFile } = useRemoveDownloadFile()

  return useMutation$({
    mutationFn: () => {
      return latestDatabase$.pipe(
        first(),
        combineLatestWith(from(dexieDb.downloads.toArray())),
        switchMap(([db, items]) => {
          const books$ = from(
            db.book
              .find({
                selector: {
                  _id: {
                    $in: items.map(({ id }) => id),
                  },
                },
              })
              .exec(),
          )

          return books$.pipe(
            switchMap((books) =>
              combineLatest(
                books.map((book) => {
                  // valid to remove
                  if (book.links.length === 0) return of(book)

                  return from(db.link.findByIds(book.links).exec()).pipe(
                    switchMap((links) => {
                      const fileLink = Array.from(links?.values() ?? []).find(
                        ({ type }) => type === localPlugin.type,
                      )

                      // local book, don't remove
                      if (fileLink) return of(null)

                      return of(book)
                    }),
                  )
                }),
              ),
            ),
            map((books) => books.filter((book) => !!book)),
            switchMap((books) => {
              return combineLatest(
                books.map((book) =>
                  from(removeDownloadFile({ bookId: book._id })),
                ),
              )
            }),
          )
        }),
        defaultIfEmpty(null),
      )
    },
  })
}
