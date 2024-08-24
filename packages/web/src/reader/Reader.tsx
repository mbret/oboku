/**
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js#L407-L469
 */
import { memo, useRef } from "react"
import { readerSignal } from "./states"
import { TopBar } from "./navigation/TopBar"
import { BottomBar } from "./navigation/BottomBar"
import { useGestureHandler } from "./gestures/gestures"
import { BookLoading } from "./BookLoading"
import { useSyncBookProgress } from "./progress/useSyncBookProgress"
import { FloatingBottom } from "./navigation/FloatingBottom"
import { usePersistReaderInstanceSettings } from "./settings/usePersistReaderSettings"
import { Notification } from "./notifications/Notification"
import { useReaderSettingsState } from "./settings/states"
import { useObserve, useSignalValue } from "reactjrx"
import { useManifest } from "./manifest/useManifest"
import { useCreateReader } from "./useCreateReader"
import { BookError } from "./BookError"
import { Box } from "@mui/material"
import { useLoadManifest } from "./useLoadReader"

export const Reader = memo(({ bookId }: { bookId: string }) => {
  const reader = useSignalValue(readerSignal)
  const readerState = useObserve(() => reader?.state$, [reader])
  const readerSettings = useReaderSettingsState()
  const readerContainerRef = useRef<HTMLDivElement>(null)
  const { data: { isUsingWebStreamer, manifest } = {}, error: manifestError } =
    useManifest(bookId)
  const isBookError = !!manifestError
  // We don't want to display overlay for comics / manga
  const showFloatingMenu =
    reader?.context.manifest?.renditionLayout !== "pre-paginated"

  useCreateReader({ bookId, isUsingWebStreamer })
  useLoadManifest({
    bookId,
    containerElement: readerContainerRef.current,
    manifest
  })

  useGestureHandler()
  useSyncBookProgress(bookId)
  usePersistReaderInstanceSettings()

  if (isBookError) {
    return <BookError bookId={bookId} manifestError={manifestError} />
  }

  return (
    <Box position="relative" height="100%" width="100%">
      <Box
        position="relative"
        height="100%"
        width="100%"
        ref={readerContainerRef}
      />
      {readerState !== "ready" && <BookLoading />}
      {readerState === "ready" && (
        <>
          <Notification />
          {showFloatingMenu && (
            <FloatingBottom
              enableProgress={readerSettings.floatingProgress === "bottom"}
              enableTime={readerSettings.floatingTime === "bottom"}
            />
          )}
          <TopBar bookId={bookId} />
          <BottomBar bookId={bookId} />
        </>
      )}
    </Box>
  )
})
