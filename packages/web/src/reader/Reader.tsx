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
import { Manifest } from "@prose-reader/shared"

export const Reader = memo(({ bookId }: { bookId: string }) => {
  const reader = useSignalValue(readerSignal)
  const readerState = useObserve(() => reader?.state$, [reader])
  const readerContainerRef = useRef<HTMLDivElement>(null)
  const { data: { isUsingWebStreamer, manifest } = {}, error: manifestError } =
    useManifest(bookId)
  const isBookError = !!manifestError

  if (isBookError) {
    return <BookError bookId={bookId} manifestError={manifestError} />
  }

  return (
    <>
      <Box position="relative" height="100%" width="100%">
        <Box
          position="relative"
          height="100%"
          width="100%"
          ref={readerContainerRef}
        />
        {readerState !== "ready" && <BookLoading />}
        <Interface bookId={bookId} />
      </Box>
      <Effects
        bookId={bookId}
        isUsingWebStreamer={isUsingWebStreamer}
        manifest={manifest}
        containerElement={readerContainerRef.current}
      />
    </>
  )
})

const Interface = memo(({ bookId }: { bookId: string }) => {
  const reader = useSignalValue(readerSignal)
  const readerState = useObserve(() => reader?.state$, [reader])
  // We don't want to display overlay for comics / manga
  const showFloatingMenu =
    reader?.context.manifest?.renditionLayout !== "pre-paginated"
  const readerSettings = useReaderSettingsState()

  return (
    <>
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
    </>
  )
})

const Effects = memo(
  ({
    bookId,
    isUsingWebStreamer,
    manifest,
    containerElement
  }: {
    bookId: string
    isUsingWebStreamer?: boolean
    manifest?: Manifest
    containerElement?: HTMLElement | null
  }) => {
    useCreateReader({ bookId, isUsingWebStreamer })
    useLoadManifest({
      bookId,
      containerElement,
      manifest
    })

    useGestureHandler()
    useSyncBookProgress(bookId)
    usePersistReaderInstanceSettings()

    return null
  }
)
