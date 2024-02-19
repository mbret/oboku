import { useEffect } from "react"
import {
  hasOpenedReaderAlreadyStateSignal,
  bookBeingReadStateSignal
} from "./states"
import { SIGNAL_RESET } from "reactjrx"

export const useTrackBookBeingRead = (bookId: string | undefined) => {
  useEffect(() => {
    bookBeingReadStateSignal.setValue(bookId)
    hasOpenedReaderAlreadyStateSignal.setValue(true)
  }, [bookId])

  useEffect(
    () => () => {
      bookBeingReadStateSignal.setValue(SIGNAL_RESET)
    },
    []
  )
}
