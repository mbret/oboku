import { useEffect, useState } from "react"
import { useBook } from "../../books/states"
import { useDialogManager } from "../../common/dialog"
import { useRemoveDownloadFile } from "../../download/useRemoveDownloadFile"
import { ReadingStateState } from "@oboku/shared"
import { useMutation } from "reactjrx"
import { getLatestDatabase } from "../../rxdb/useCreateDatabase"
import { Observable, mergeMap, noop, of } from "rxjs"
import { getBookById } from "../../books/helpers"

export const useShowRemoveBookOnExitDialog = ({
  onSettled,
  bookId
}: {
  onSettled?: () => void
  bookId?: string
}) => {
  const dialog = useDialogManager()
  const removeDownloadFile = useRemoveDownloadFile()
  const { data: book } = useBook({ id: bookId })
  const readingState = book?.readingStateCurrentState
  const [wasAlreadyFinished, setWasAlreadyFinished] = useState(true)

  useEffect(() => {
    if (readingState && readingState !== ReadingStateState.Finished) {
      setWasAlreadyFinished(false)
    }
  }, [readingState, setWasAlreadyFinished])

  return useMutation({
    mutationFn: () =>
      getLatestDatabase().pipe(
        mergeMap((database) => {
          if (!bookId) throw new Error("Invalid bookId")

          return of({ database, id: bookId })
        }),
        mergeMap(({ database, id }) => getBookById({ database, id })),
        mergeMap((book) => {
          const isBookFinished =
            book?.readingStateCurrentState === ReadingStateState.Finished

          if (!isBookFinished || (isBookFinished && wasAlreadyFinished)) {
            return of(null)
          }

          return new Observable((subscriber) => {
            dialog({
              title: "Free up some space!",
              content:
                "Congratulation on finishing your book! Would you like to remove its download to free up some space? (Don't worry the book will not be removed, only its locally downloaded files)",
              cancellable: true,
              confirmTitle: "Remove",
              cancelTitle: "Keep",
              canEscape: false,
              onConfirm: () => {
                removeDownloadFile(book._id).catch(noop)
              },
              onClose: () => {
                subscriber.next()
                subscriber.complete()
              }
            })
          })
        })
      ),
    onSettled
  })
}
