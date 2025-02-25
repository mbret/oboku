/**
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js#L407-L469
 */
import { memo, useRef } from "react"
import { isMenuShownStateSignal, readerSignal } from "./states"
import { useGestureHandler } from "./gestures/useGestureHandler"
import { BookLoading } from "./BookLoading"
import { useSyncBookProgress } from "./progress/useSyncBookProgress"
import { usePersistReaderInstanceSettings } from "./settings/usePersistReaderSettings"
import { Notification } from "./notifications/Notification"
import { useReaderSettingsState } from "./settings/states"
import { useObserve, useSignalValue } from "reactjrx"
import { useManifest } from "./manifest/useManifest"
import { useCreateReader } from "./useCreateReader"
import { BookError } from "./BookError"
import { Box } from "@mui/material"
import { useLoadManifest } from "./useLoadReader"
import type { Manifest } from "@prose-reader/shared"
import { ReactReaderProvider, ReactReader } from "@prose-reader/react-reader"
import { useShowRemoveBookOnExitDialog } from "./navigation/useShowRemoveBookOnExitDialog"
import { useSafeGoBack } from "../navigation/useSafeGoBack"
import { useMoreDialog } from "./navigation/MoreDialog"

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
      <Box position="relative" height="100%" width="100%" overflow="hidden">
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
  const readerSettings = useReaderSettingsState()
  const isMenuShow = useSignalValue(isMenuShownStateSignal)
  const { goBack } = useSafeGoBack()
  const { toggleMoreDialog } = useMoreDialog()
  const { mutate } = useShowRemoveBookOnExitDialog({
    bookId,
    onSettled: () => {
      goBack()
    }
  })

  return (
    <>
      {readerState === "ready" && (
        <>
          <ReactReaderProvider
            reader={reader}
            quickMenuOpen={isMenuShow}
            onQuickMenuOpenChange={(isOpen) => {
              isMenuShownStateSignal.setValue(isOpen)
            }}
          >
            <ReactReader
              onItemClick={item => {
                if (item === "more") {
                  toggleMoreDialog()
                }
                if (item === "back") {
                  mutate()
                }
              }}
              enableFloatingTime={readerSettings.floatingTime === "bottom"}
              enableFloatingProgress={
                readerSettings.floatingProgress === "bottom"
              }
            />
          </ReactReaderProvider>
          <Notification />
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
