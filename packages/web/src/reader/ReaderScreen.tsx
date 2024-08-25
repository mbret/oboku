import { memo, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useWakeLock } from "../common/useWakeLock"
import { useFullscreenAutoSwitch } from "./settings/fullScreen"
import { Reader } from "./Reader"
import { MoreDialog } from "./navigation/MoreDialog"
import { useTrackBookBeingRead } from "../reading/useTrackBookBeingRead"
import { isMenuShownStateSignal, readerSignal } from "./states"
import { SIGNAL_RESET } from "reactjrx"

export const ReaderScreen = memo(() => {
  const { bookId } = useParams<{ bookId?: string }>()

  useTrackBookBeingRead(bookId)
  useWakeLock()
  useFullscreenAutoSwitch()

  useEffect(
    () => () => {
      ;[isMenuShownStateSignal, readerSignal].forEach((signal) =>
        signal.setValue(SIGNAL_RESET)
      )
    },
    []
  )

  return (
    <>
      {bookId && <Reader bookId={bookId} />}
      <MoreDialog bookId={bookId} />
    </>
  )
})
