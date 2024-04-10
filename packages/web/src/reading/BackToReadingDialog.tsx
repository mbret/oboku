import { memo, useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import { ROUTES } from "../constants"
import {
  hasOpenedReaderAlreadyStateSignal,
  bookBeingReadStateSignal
} from "./states"
import { useSignalValue } from "reactjrx"
import { useBook } from "../books/states"
import { getMetadataFromBook } from "../books/getMetadataFromBook"
import { useCreateBackToBookDialog } from "./useCreateBackToBookDialog"

const BASE_READER_ROUTE = ROUTES.READER.replace(`/:id`, ``)

export const BackToReadingDialog = memo(() => {
  const bookBeingRead = useSignalValue(bookBeingReadStateSignal)
  const { data: book, isSuccess } = useBook({ id: bookBeingRead })
  const { title } = getMetadataFromBook(book)
  const hasOpenedReaderAlready = useSignalValue(
    hasOpenedReaderAlreadyStateSignal
  )
  const location = useLocation()

  const { mutate, submittedAt } = useCreateBackToBookDialog()

  const shouldIgnore =
    submittedAt ||
    hasOpenedReaderAlready ||
    !bookBeingRead ||
    location.pathname.startsWith(BASE_READER_ROUTE) ||
    !isSuccess

  useEffect(() => {
    if (shouldIgnore) {
      return
    }

    mutate({ bookId: bookBeingRead, title })
  }, [bookBeingRead, title, mutate, shouldIgnore])

  return null
})
