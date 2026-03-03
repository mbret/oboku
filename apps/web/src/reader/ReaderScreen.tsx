import { memo, useEffect } from "react"
import { useParams } from "react-router"
import { useWakeLock } from "../common/useWakeLock"
import { useFullscreenAutoSwitch } from "./settings/fullScreen"
import { Reader } from "./Reader"
import { MoreDialog } from "./navigation/MoreDialog"
import { useTrackBookBeingRead } from "../reading/useTrackBookBeingRead"
import { isMenuShownStateSignal, readerSignal } from "./states"
import { SIGNAL_RESET, SignalContextProvider } from "reactjrx"

export const ReaderScreen = memo(() => {
  const { bookId } = useParams<{ bookId?: string }>()

  return (
    <SignalContextProvider>
      {bookId && <Reader bookId={bookId} />}
      <MoreDialog bookId={bookId} />
      <Effects bookId={bookId} />
    </SignalContextProvider>
  )
})

const Effects = memo(({ bookId }: { bookId?: string }) => {
  useTrackBookBeingRead(bookId)
  useWakeLock()
  useFullscreenAutoSwitch()

  useEffect(
    () => () => {
      isMenuShownStateSignal.update(SIGNAL_RESET)
      readerSignal.update(SIGNAL_RESET)
    },
    [],
  )

  return null
})
