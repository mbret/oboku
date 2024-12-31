import { useRemoveBook } from "../helpers"
import { useMutation$ } from "reactjrx"
import { getLatestDatabase } from "../../rxdb/RxDbProvider"
import { first, from, mergeMap, of } from "rxjs"
import { isRemovableFromDataSource } from "../../links/isRemovableFromDataSource"
import { createDialog } from "../../common/dialogs/createDialog"
import { withOfflineErrorDialog } from "../../common/network/withOfflineErrorDialog"
import { observeLinkById } from "../../links/dbHelpers"
import { getDataSourcePlugin } from "../../dataSources/helpers"
import { withUnknownErrorDialog } from "../../errors/withUnknownErrorDialog"
import { getBookById } from "../dbHelpers"

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

  return useMutation$({
    mutationFn: ({ bookId }: { bookId: string }) => {
      const mutation$ = getLatestDatabase().pipe(
        mergeMap((database) => {
          return from(getBookById({ database, id: bookId })).pipe(
            mergeMap((book) => {
              if (!book) throw new Error("book not found")

              const linkId = book.links[0]

              const link$ = !linkId
                ? of(null)
                : observeLinkById(database, linkId).pipe(first())

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
                mergeMap(({ deleteFromDataSource }) =>
                  from(
                    removeBook({
                      id: book._id,
                      deleteFromDataSource: deleteFromDataSource
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
