import { memo, useEffect } from "react"
import { useParams, useSearchParams } from "react-router"
import { useWakeLock } from "../common/useWakeLock"
import { useFullscreenAutoSwitch } from "./settings/fullScreen"
import { Reader } from "./Reader"
import { MoreDialog } from "./navigation/MoreDialog"
import { useTrackBookBeingRead } from "../reading/useTrackBookBeingRead"
import { isMenuShownStateSignal, readerSignal } from "./states"
import { SIGNAL_RESET, SignalContextProvider } from "reactjrx"

export const READER_MODE_PARAM = "mode"
export const READER_PREVIEW_MODE = "preview"

export const ReaderScreen = memo(() => {
  const { bookId } = useParams<{ bookId?: string }>()
  const [searchParams] = useSearchParams()
  const isPreview = searchParams.get(READER_MODE_PARAM) === READER_PREVIEW_MODE

  return (
    <SignalContextProvider>
      {bookId && <Reader bookId={bookId} isPreview={isPreview} />}
      <MoreDialog bookId={bookId} />
      <Effects bookId={bookId} isPreview={isPreview} />
    </SignalContextProvider>
  )
})

const Effects = memo(function Effects({
  bookId,
  isPreview,
}: {
  bookId?: string
  isPreview: boolean
}) {
  useTrackBookBeingRead(bookId, { enabled: !isPreview })
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
