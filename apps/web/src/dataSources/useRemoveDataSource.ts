import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { combineLatest, first, from, mergeMap, of } from "rxjs"
import { withDialog } from "../common/dialogs/withDialog"
import { getLinksForDataSource } from "../links/dbHelpers"
import { useRemoveBook } from "../books/helpers"
import { observeDataSourceById } from "./dbHelpers"
import { withUnknownErrorDialog } from "../errors/withUnknownErrorDialog"
import { useMutation$ } from "reactjrx"

export const useRemoveDataSource = () => {
  const { mutateAsync: removeBook } = useRemoveBook()

  return useMutation$({
    mutationFn: ({ id }: { id: string }) =>
      getLatestDatabase().pipe(
        withDialog({ preset: "CONFIRM" }),
        withDialog({
          title: "Remove books?",
          content:
            "Do you want to delete the books together with the data source?",
          cancellable: true,
          actions: [
            {
              title: "Yes",
              type: "confirm",
              onConfirm: () => true,
            },
            {
              title: "No",
              type: "confirm",
              onConfirm: () => false,
            },
          ],
        }),
        mergeMap(([[db], deleteBooks]) =>
          observeDataSourceById(db, id).pipe(
            first(),
            mergeMap((dataSource) => {
              if (!dataSource) throw new Error("Invalid data source")

              const dataSourceDelete$ = from(dataSource.remove())

              if (deleteBooks) {
                const links$ = from(getLinksForDataSource(db, dataSource))

                return links$.pipe(
                  mergeMap((links) => {
                    const booksDelete$ = links.map((link) =>
                      !link.book
                        ? of(null)
                        : from(
                            removeBook({
                              id: link.book,
                              deleteFromDataSource: false,
                            }),
                          ),
                    )

                    return combineLatest([dataSourceDelete$, ...booksDelete$])
                  }),
                )
              }

              return dataSourceDelete$
            }),
          ),
        ),
        withUnknownErrorDialog(),
      ),
  })
}
