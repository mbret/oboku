import { useRemoveDownloadFile } from "./useRemoveDownloadFile"
import { plugin as localPlugin } from "../plugins/local"
import { useMutation } from "reactjrx"
import { combineLatest, first, from, map, of, switchMap, tap } from "rxjs"
import { getBookKeysFromStorage } from "./helpers"
import { latestDatabase$ } from "../rxdb/RxDbProvider"

export const useRemoveAllDownloadedFiles = () => {
  const { mutateAsync: removeDownloadFile } = useRemoveDownloadFile()

  return useMutation({
    mutationFn: () => {
      return combineLatest([
        latestDatabase$,
        from(getBookKeysFromStorage())
      ]).pipe(
        first(),
        switchMap(([db, keys]) => {
          const books$ = from(
            db.book
              .find({
                selector: {
                  _id: {
                    $in: keys.map(({ bookId }) => bookId)
                  }
                }
              })
              .exec()
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
                        ({ type }) => type === localPlugin.type
                      )

                      // local book, don't remove
                      if (fileLink) return of(null)

                      return of(book)
                    })
                  )
                })
              )
            ),
            map((books) => books.filter((book) => !!book)),
            switchMap((books) =>
              combineLatest(
                books.map((book) =>
                  from(removeDownloadFile({ bookId: book._id }))
                )
              )
            )
          )
        })
      )
    }
  })
}
