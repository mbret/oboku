import { useEffect, useRef } from "react"
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

export const BackToReadingDialog = () => {
  const isOpen = useRef(false)
  const bookBeingRead = useSignalValue(bookBeingReadStateSignal)
  const { data: book, isSuccess } = useBook({ id: bookBeingRead })
  const { title } = getMetadataFromBook(book)
  const hasOpenedReaderAlready = useSignalValue(
    hasOpenedReaderAlreadyStateSignal
  )
  const location = useLocation()

  const { mutate } = useCreateBackToBookDialog()

  useEffect(() => {
    if (
      isOpen.current ||
      hasOpenedReaderAlready ||
      !bookBeingRead ||
      location.pathname.startsWith(BASE_READER_ROUTE) ||
      !isSuccess
    ) {
      return
    }

    isOpen.current = true

    mutate({ bookId: bookBeingRead, title })
  }, [
    bookBeingRead,
    location,
    hasOpenedReaderAlready,
    title,
    mutate,
    isSuccess
  ])

  return null
}
