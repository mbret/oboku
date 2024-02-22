import { FC, useEffect } from "react"
import { useParams } from "react-router-dom"
import { AppTourReader } from "../firstTimeExperience/AppTourReader"
import { useWakeLock } from "../common/useWakeLock"
import { useFullScreenSwitch } from "./fullScreen"
import { Reader } from "./Reader"
import { MoreDialog } from "./MoreDialog"
import { useTrackBookBeingRead } from "../reading/useTrackBookBeingRead"
import {
  isBookReadyStateSignal,
  isMenuShownStateSignal,
  manifestStateSignal,
  readerStateSignal
} from "./states"
import { SIGNAL_RESET } from "reactjrx"

export const ReaderScreen: FC<{}> = () => {
  const { bookId } = useParams<{ bookId?: string }>()

  useTrackBookBeingRead(bookId)
  useWakeLock()
  useFullScreenSwitch()

  useEffect(() => () => {
    ;[
      isBookReadyStateSignal,
      manifestStateSignal,
      isMenuShownStateSignal,
      readerStateSignal
    ].forEach((signal) => signal.setValue(SIGNAL_RESET))
  }, [])

  return (
    <>
      {bookId && <Reader bookId={bookId} />}
      <AppTourReader />
      <MoreDialog />
    </>
  )
}
