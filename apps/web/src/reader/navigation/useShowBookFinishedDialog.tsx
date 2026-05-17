import { ReadingStateState } from "@oboku/shared"
import { observeBookBoundaryReached } from "@prose-reader/core"
import { useMutation } from "@tanstack/react-query"
import { useCallback, useEffect, useState } from "react"
import { filter, of, switchMap, take } from "rxjs"
import { useSubscribe } from "reactjrx"
import { useBook } from "../../books/states"
import { useRemoveDownloadFile } from "../../download/useRemoveDownloadFile"
import { useReader } from "../states"
import { BookFinishedDialog } from "./BookFinishedDialog"
import { createCustomDialog } from "../../common/dialogs/createCustomDialog"
import { catchCancelError } from "../../errors/catchCancelError"

type BookFinishedDialogState = {
  bookId: string
  wasFinishedWhenOpened: boolean
  wasDialogShown: boolean
}

export const useShowBookFinishedDialog = ({
  bookId,
  onClose,
  enabled = true,
}: {
  bookId: string
  onClose: () => void
  enabled?: boolean
}) => {
  const reader = useReader()
  const { mutate: removeDownloadFile } = useRemoveDownloadFile()
  const { data: book } = useBook({ id: bookId })
  const [bookFinishedDialogState, setBookFinishedDialogState] =
    useState<BookFinishedDialogState>()

  useEffect(
    function setBookFinishedDialogStateEffect() {
      if (!enabled) return
      if (!book || bookFinishedDialogState?.bookId === bookId) {
        return
      }

      setBookFinishedDialogState({
        bookId,
        wasFinishedWhenOpened:
          book.readingStateCurrentState === ReadingStateState.Finished,
        wasDialogShown: false,
      })
    },
    [book, bookFinishedDialogState?.bookId, bookId, enabled],
  )

  const createBookFinishedDialog = useCallback(() => {
    return createCustomDialog<boolean>({
      render: ({ cancel, confirm }) => (
        <BookFinishedDialog
          onCancel={cancel}
          onConfirm={(shouldDeleteDownloadFile) => {
            if (shouldDeleteDownloadFile) {
              removeDownloadFile({ bookId })
            }

            confirm(shouldDeleteDownloadFile)
          }}
        />
      ),
    })
  }, [bookId, removeDownloadFile])

  const wasFinishedWhenOpened =
    bookFinishedDialogState?.bookId === bookId
      ? bookFinishedDialogState.wasFinishedWhenOpened
      : undefined
  const wasDialogShown =
    bookFinishedDialogState?.bookId === bookId
      ? bookFinishedDialogState.wasDialogShown
      : false

  const markDialogAsShown = useCallback(() => {
    if (!bookFinishedDialogState) return false
    if (bookFinishedDialogState.bookId !== bookId) return false
    if (bookFinishedDialogState.wasDialogShown) return false

    setBookFinishedDialogState({
      ...bookFinishedDialogState,
      wasDialogShown: true,
    })

    return true
  }, [bookFinishedDialogState, bookId])

  const subscribeToBookBoundaryReached = useCallback(() => {
    if (!enabled) return
    if (!reader || wasFinishedWhenOpened !== false) return
    if (wasDialogShown) return

    return observeBookBoundaryReached(reader).pipe(
      filter(({ boundary }) => boundary === "end"),
      take(1),
      switchMap(() => {
        if (!markDialogAsShown()) return of(null)

        return createBookFinishedDialog().promise.then(() => {
          onClose()

          return null
        })
      }),
      catchCancelError(() => of(null)),
    )
  }, [
    markDialogAsShown,
    reader,
    enabled,
    wasDialogShown,
    wasFinishedWhenOpened,
    createBookFinishedDialog,
    onClose,
  ])

  useSubscribe(subscribeToBookBoundaryReached)

  const { mutate: showBookFinishedDialogOnClose } = useMutation({
    mutationFn: async () => {
      if (!enabled) return null
      if (wasFinishedWhenOpened !== false) return null
      if (wasDialogShown) return null
      if (book?.readingStateCurrentState !== ReadingStateState.Finished) {
        return null
      }
      if (!markDialogAsShown()) return null

      return createBookFinishedDialog().promise
    },
    onSettled: () => {
      onClose()
    },
  })

  return {
    showBookFinishedDialogOnClose,
  }
}
