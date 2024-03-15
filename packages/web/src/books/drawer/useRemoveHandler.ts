import { getBookById, useRemoveBook } from "../helpers"
import { useDialogManager } from "../../common/dialog"
import { useMutation } from "reactjrx"
import { getLatestDatabase } from "../../rxdb/useCreateDatabase"
import { catchError, from, map, mergeMap } from "rxjs"
import { isRemovableFromDataSource } from "../../links/isRemovableFromDataSource"
import { getDataSourcePlugin } from "../../dataSources/getDataSourcePlugin"
import { getLinkById } from "../../links/helpers"

type Return = {
  isDeleted: boolean
}

export const useRemoveHandler = (
  options: { onSuccess?: (data: Return) => void; onError?: () => void } = {}
) => {
  const removeBook = useRemoveBook()
  const dialog = useDialogManager()

  return useMutation({
    mutationFn: ({ bookId }: { bookId: string }) => {
      return getLatestDatabase().pipe(
        mergeMap((database) => {
          return getBookById({ database, id: bookId }).pipe(
            mergeMap((book) => {
              if (!book) throw new Error("book not found")

              const linkId = book.links[0]

              if (!book?.isAttachedToDataSource || !linkId) {
                return from(
                  new Promise<Return>((resolve, reject) => {
                    dialog({
                      preset: "CONFIRM",
                      title: "Delete a book",
                      content: `You are about to delete a book, are you sure ?`,
                      onConfirm: () => {
                        removeBook({ id: book._id })
                          .then(() => resolve({ isDeleted: true }))
                          .catch(reject)
                      },
                      onCancel: () => {
                        resolve({ isDeleted: false })
                      }
                    })
                  })
                )
              }

              return getLinkById(database, linkId).pipe(
                mergeMap((firstLink) => {
                  if (!firstLink) {
                    return from(removeBook({ id: book._id })).pipe(
                      map(() => ({ isDeleted: true }))
                    )
                  }

                  const plugin = getDataSourcePlugin(firstLink?.type)

                  if (
                    book?.isAttachedToDataSource &&
                    !isRemovableFromDataSource({ link: firstLink })
                  ) {
                    return from(
                      new Promise<Return>((resolve, reject) => {
                        dialog({
                          preset: "CONFIRM",
                          title: "Delete a book",
                          content: `This book has been synchronized with one of your ${plugin?.name} data source. Oboku does not support deletion from ${plugin?.name} directly so consider deleting it there manually if you don't want the book to be synced again`,
                          onConfirm: () => {
                            removeBook({ id: book._id })
                              .then(() => resolve({ isDeleted: true }))
                              .catch(reject)
                          },
                          onCancel: () => {
                            resolve({ isDeleted: false })
                          }
                        })
                      })
                    )
                  } else {
                    return from(
                      new Promise<Return>((resolve, reject) => {
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
                                  .then(() => resolve({ isDeleted: true }))
                                  .catch(reject)
                              }
                            },
                            {
                              type: "confirm",
                              title: "only oboku",
                              onClick: () => {
                                removeBook({ id: book._id })
                                  .then(() => resolve({ isDeleted: true }))
                                  .catch(reject)
                              }
                            }
                          ],
                          onCancel: () => {
                            resolve({ isDeleted: false })
                          }
                        })
                      })
                    )
                  }
                })
              )
            })
          )
        }),
        catchError((e) => {
          console.error(e)

          throw e
        })
      )
    },
    ...options
  })
}
