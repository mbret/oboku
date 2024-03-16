import { getBookById, useRemoveBook } from "../helpers"
import { useMutation } from "reactjrx"
import { getLatestDatabase } from "../../rxdb/useCreateDatabase"
import { from, map, mergeMap, of, tap } from "rxjs"
import { isRemovableFromDataSource } from "../../links/isRemovableFromDataSource"
import { getDataSourcePlugin } from "../../dataSources/getDataSourcePlugin"
import { getLinkById } from "../../links/helpers"
import { createDialog } from "../../common/dialogs/createDialog"
import { withUnknownErrorDialog } from "../../common/errors/withUnknownErrorDialog"
import { withOfflineErrorDialog } from "../../common/network/withOfflineErrorDialog"
import { useLock } from "../../common/BlockingBackdrop"

const deleteBookNormallyDialog: Parameters<
  typeof createDialog<{ deleteFromDataSource: boolean }>
>[0] = {
  preset: "CONFIRM",
  title: "Delete a book",
  content: `You are about to delete a book, are you sure ?`,
  onConfirm: () => ({ deleteFromDataSource: false })
}

export const useRemoveHandler = (
  options: { onSuccess?: () => void; onError?: () => void } = {}
) => {
  const { mutateAsync: removeBook } = useRemoveBook()
  const [lock] = useLock()

  return useMutation({
    mutationFn: ({ bookId }: { bookId: string }) => {
      const mutation$ = getLatestDatabase().pipe(
        mergeMap((database) => {
          return getBookById({ database, id: bookId }).pipe(
            mergeMap((book) => {
              if (!book) throw new Error("book not found")

              const linkId = book.links[0]

              const link$ = !linkId ? of(null) : getLinkById(database, linkId)

              return link$.pipe(
                mergeMap((firstLink) => {
                  if (!firstLink) {
                    return createDialog(deleteBookNormallyDialog).$
                  }

                  const plugin = getDataSourcePlugin(firstLink?.type)

                  if (!isRemovableFromDataSource({ link: firstLink })) {
                    return createDialog(deleteBookNormallyDialog).$
                  } else {
                    return createDialog({
                      preset: "CONFIRM",
                      title: "Delete a book",
                      content: `Do you wish to delete the original file present on the source ${plugin?.name} as well?`,
                      actions: [
                        {
                          type: "confirm",
                          title: "both",
                          onConfirm: () => ({ deleteFromDataSource: true })
                        },
                        {
                          type: "confirm",
                          title: "only oboku",
                          onConfirm: () => ({ deleteFromDataSource: false })
                        }
                      ]
                    }).$
                  }
                }),
                map((data) => [data, lock()] as const),
                mergeMap(([{ deleteFromDataSource }, unlock]) =>
                  from(
                    removeBook({
                      id: book._id,
                      deleteFromDataSource: deleteFromDataSource
                    })
                  ).pipe(
                    tap(() => {
                      unlock()
                    })
                  )
                )
              )
            })
          )
        }),
        withOfflineErrorDialog(),
        withUnknownErrorDialog()
      )

      return mutation$
    },
    ...options
  })
}
