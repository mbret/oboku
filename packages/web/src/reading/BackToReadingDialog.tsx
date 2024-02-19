import { useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ROUTES } from "../constants"
import { useDialogManager } from "../dialog"
import {
  hasOpenedReaderAlreadyStateSignal,
  bookBeingReadStateSignal
} from "./states"
import { SIGNAL_RESET, useSignalValue } from "reactjrx"

const BASE_READER_ROUTE = ROUTES.READER.replace(`/:id`, ``)

export const BackToReadingDialog = () => {
  const isOpen = useRef(false)
  const bookBeingRead = useSignalValue(bookBeingReadStateSignal)
  const hasOpenedReaderAlready = useSignalValue(
    hasOpenedReaderAlreadyStateSignal
  )
  const dialog = useDialogManager()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (
      isOpen.current ||
      hasOpenedReaderAlready ||
      !bookBeingRead ||
      location.pathname.startsWith(BASE_READER_ROUTE)
    ) {
      return
    }

    isOpen.current = true

    dialog({
      title: `Take me back to my book`,
      content: `It looks like you were reading a book last time you used the app. Do you want to go back to reading?`,
      cancellable: true,
      onConfirm: () => {
        navigate(ROUTES.READER.replace(":id", bookBeingRead))
        isOpen.current = false
      },
      onCancel: () => {},
      onClose: () => {
        bookBeingReadStateSignal.setValue(SIGNAL_RESET)
        isOpen.current = false
      }
    })
  }, [dialog, bookBeingRead, location, navigate, hasOpenedReaderAlready])

  return null
}
