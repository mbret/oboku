import { getBookById, useRemoveBook } from "../helpers"
import { useDialogManager } from "../../dialog"
import { useMutation } from "reactjrx"
import { latestDatabase$ } from "../../rxdb/useCreateDatabase"
import { EMPTY, endWith, first, ignoreElements, mergeMap } from "rxjs"
import { isRemovableFromDataSource } from "../../links/isRemovableFromDataSource"
import { getDataSourcePlugin } from "../../dataSources/getDataSourcePlugin"
import { getLinkById } from "../../links/helpers"

export const useRemoveHandler = () => {
  const removeBook = useRemoveBook()
  const dialog = useDialogManager()

  return useMutation({
    mutationFn: ({ bookId }: { bookId: string }) => {
      return latestDatabase$.pipe(
        first(),
        mergeMap((database) => {
          return getBookById({ database, id: bookId }).pipe(
            mergeMap((book) => {
              if (!book) throw new Error("book not found")

              const linkId = book.links[0]

              if (!book?.isAttachedToDataSource || !linkId) {
                dialog({
                  preset: "CONFIRM",
                  title: "Delete a book",
                  content: `You are about to delete a book, are you sure ?`,
                  onConfirm: () => {
                    removeBook({ id: book._id })
                  }
                })

                return EMPTY
              }

              return getLinkById(database, linkId).pipe(
                mergeMap((firstLink) => {
                  if (!firstLink) return EMPTY

                  const plugin = getDataSourcePlugin(firstLink?.type)

                  if (
                    book?.isAttachedToDataSource &&
                    !isRemovableFromDataSource({ link: firstLink })
                  ) {
                    dialog({
                      preset: "CONFIRM",
                      title: "Delete a book",
                      content: `This book has been synchronized with one of your ${plugin?.name} data source. Oboku does not support deletion from ${plugin?.name} directly so consider deleting it there manually if you don't want the book to be synced again`,
                      onConfirm: () => {
                        removeBook({ id: book._id })
                      }
                    })
                  } else {
                    dialog({
                      preset: "CONFIRM",
                      title: "Delete a book",
                      content: `This book has been synchronized with one of your ${plugin?.name} data source. You can delete it from both oboku and ${plugin?.name} which will prevent the book to be synced again`,
                      actions: [
                        {
                          type: "confirm",
                          title: "both",
                          onClick: () => {
                            removeBook({
                              id: book._id,
                              deleteFromDataSource: true
                            })
                          }
                        },
                        {
                          type: "confirm",
                          title: "only oboku",
                          onClick: () => {
                            removeBook({ id: book._id })
                          }
                        }
                      ]
                    })
                  }

                  return EMPTY
                })
              )
            })
          )
        }),
        ignoreElements(),
        endWith(null)
      )
    }
  })
}
