import { memo, useEffect } from "react"
import { type PathParam, useParams, useSearchParams } from "react-router"
import { useWakeLock } from "../common/browser"
import { useFullscreenAutoSwitch } from "./settings/fullScreen"
import { Reader } from "./Reader"
import { MoreDialog } from "./navigation/MoreDialog"
import { useTrackBookBeingRead } from "../reading/useTrackBookBeingRead"
import { isMenuShownStateSignal } from "./states"
import { SIGNAL_RESET, SignalContextProvider } from "reactjrx"
import { useLocalSettings } from "../settings/useLocalSettings"
import type { ROUTES } from "../navigation/routes"
import { getUsesReadingData } from "./mode"

export const ReaderScreen = memo(function ReaderScreen() {
  const { id: bookId } = useParams<PathParam<typeof ROUTES.READER>>()
  const [searchParams] = useSearchParams()
  const usesReadingData = getUsesReadingData(searchParams)

  return (
    <SignalContextProvider>
      {bookId && <Reader bookId={bookId} usesReadingData={usesReadingData} />}
      <MoreDialog />
      <Effects bookId={bookId} usesReadingData={usesReadingData} />
    </SignalContextProvider>
  )
})

const Effects = memo(function Effects({
  bookId,
  usesReadingData,
}: {
  bookId?: string
  usesReadingData: boolean
}) {
  const isWakeLockEnabled = useLocalSettings("readerWakeLockEnabled")

  useTrackBookBeingRead(bookId, { enabled: usesReadingData })
  useWakeLock({ enabled: isWakeLockEnabled })
  useFullscreenAutoSwitch()

  useEffect(function resetReaderStateOnLeave() {
    return function resetMenuShownOnUnmount() {
      isMenuShownStateSignal.update(SIGNAL_RESET)
    }
  }, [])

  return null
})
