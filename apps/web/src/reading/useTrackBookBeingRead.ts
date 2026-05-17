import { useEffect } from "react"
import {
  hasOpenedReaderAlreadyStateSignal,
  bookBeingReadStateSignal,
} from "./states"
import { SIGNAL_RESET } from "reactjrx"

export const useTrackBookBeingRead = (
  bookId: string | undefined,
  { enabled = true }: { enabled?: boolean } = {},
) => {
  useEffect(() => {
    if (!enabled) return

    bookBeingReadStateSignal.setValue(bookId)
    hasOpenedReaderAlreadyStateSignal.setValue(true)
  }, [bookId, enabled])

  useEffect(
    () => () => {
      if (!enabled) return

      bookBeingReadStateSignal.setValue(SIGNAL_RESET)
    },
    [enabled],
  )
}
