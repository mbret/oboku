import { FC, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useWakeLock } from "../common/useWakeLock"
import { useFullscreenAutoSwitch } from "./fullScreen"
import { Reader } from "./Reader"
import { MoreDialog } from "./MoreDialog"
import { useTrackBookBeingRead } from "../reading/useTrackBookBeingRead"
import {
  isBookReadyStateSignal,
  isMenuShownStateSignal,
  readerStateSignal
} from "./states"
import { SIGNAL_RESET } from "reactjrx"

export const ReaderScreen: FC<{}> = () => {
  const { bookId } = useParams<{ bookId?: string }>()

  useTrackBookBeingRead(bookId)
  useWakeLock()
  useFullscreenAutoSwitch()

  useEffect(
    () => () => {
      ;[
        isBookReadyStateSignal,
        isMenuShownStateSignal,
        readerStateSignal
      ].forEach((signal) => signal.setValue(SIGNAL_RESET))
    },
    []
  )

  return (
    <>
      {bookId && <Reader bookId={bookId} />}
      <MoreDialog />
    </>
  )
}
