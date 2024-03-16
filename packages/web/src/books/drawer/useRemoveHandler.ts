import { getBookById, useRemoveBook } from "../helpers"
import { useMutation } from "reactjrx"
import { getLatestDatabase } from "../../rxdb/useCreateDatabase"
import { combineLatest, from, map, mergeMap, of } from "rxjs"
import { isRemovableFromDataSource } from "../../links/isRemovableFromDataSource"
import { getDataSourcePlugin } from "../../dataSources/getDataSourcePlugin"
import { getLinkById } from "../../links/helpers"
import { createDialog } from "../../common/dialogs/createDialog"
import { withUnknownErrorDialog } from "../../common/errors/withUnknownErrorDialog"
import { withOfflineErrorDialog } from "../../common/network/withOfflineErrorDialog"

export const useRemoveHandler = (
  options: { onSuccess?: () => void; onError?: () => void } = {}
) => {
  const { mutateAsync: removeBook } = useRemoveBook()

  return useMutation({
    mutationFn: ({ bookId }: { bookId: string }) => {
      const mutation$ = getLatestDatabase().pipe(
        mergeMap((database) => {
          return getBookById({ database, id: bookId }).pipe(
            mergeMap((book) => {
              if (!book) throw new Error("book not found")

              const linkId = book.links[0]

              if (!book?.isAttachedToDataSource || !linkId) {
                return combineLatest([
                  of(book),
                  createDialog({
                    preset: "CONFIRM",
                    title: "Delete a book",
                    content: `You are about to delete a book, are you sure ?`,
                    onConfirm: () => ({ deleteFromDataSource: false })
                  }).$
                ])
              }

              return getLinkById(database, linkId).pipe(
                mergeMap((firstLink) => {
                  if (!firstLink) {
                    return of({ deleteFromDataSource: false })
                  }

                  const plugin = getDataSourcePlugin(firstLink?.type)

                  if (
                    book?.isAttachedToDataSource &&
                    !isRemovableFromDataSource({ link: firstLink })
                  ) {
                    return createDialog({
                      preset: "CONFIRM",
                      title: "Delete a book",
                      content: `This book has been synchronized with one of your ${plugin?.name} data source. Oboku does not support deletion from ${plugin?.name} directly so consider deleting it there manually if you don't want the book to be synced again`,
                      onConfirm: () => ({ deleteFromDataSource: false })
                    }).$
                  } else {
                    return createDialog({
                      preset: "CONFIRM",
                      title: "Delete a book",
                      content: `This book has been synchronized with one of your ${plugin?.name} data source. You can delete it from both oboku and ${plugin?.name} which will prevent the book to be synced again`,
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
                map(
                  ({ deleteFromDataSource }) =>
                    [book, { deleteFromDataSource }] as const
                )
              )
            }),
            mergeMap(([book, { deleteFromDataSource }]) =>
              from(
                removeBook({
                  id: book._id,
                  deleteFromDataSource: deleteFromDataSource
                })
              )
            )
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
