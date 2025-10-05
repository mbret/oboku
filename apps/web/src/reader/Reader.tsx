/**
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js#L407-L469
 */
import { type ComponentProps, memo, useCallback, useRef } from "react"
import { isMenuShownStateSignal, readerSignal } from "./states"
import { useGestureHandler } from "./gestures/useGestureHandler"
import { BookLoading } from "./BookLoading"
import { useSyncBookProgress } from "./progress/useSyncBookProgress"
import { useObserve, useSignalValue } from "reactjrx"
import { useManifest } from "./manifest/useManifest"
import { useCreateReader } from "./useCreateReader"
import { BookError } from "./BookError"
import { Box } from "@mui/material"
import { useLoadReader } from "./useLoadReader"
import type { Manifest } from "@prose-reader/shared"
import { ReactReader } from "@prose-reader/react-reader"
import { useShowRemoveBookOnExitDialog } from "./navigation/useShowRemoveBookOnExitDialog"
import { useSafeGoBack } from "../navigation/useSafeGoBack"
import { useMoreDialog } from "./navigation/MoreDialog"
import { localSettingsSignal } from "../settings/useLocalSettings"
import { useSettingsFormValues } from "./settings/useSettingsFormValues"

export const Reader = memo(({ bookId }: { bookId: string }) => {
  const reader = useSignalValue(readerSignal)
  const readerState = useObserve(() => reader?.state$, [reader])
  const readerContainerRef = useRef<HTMLDivElement>(null)
  const { data: { isUsingWebStreamer, manifest } = {}, error: manifestError } =
    useManifest(bookId)
  const isBookError = !!manifestError
  const localSettings = useSignalValue(
    localSettingsSignal,
    ({ readerFloatingProgress, readerFloatingTime }) => ({
      readerFloatingProgress,
      readerFloatingTime,
    }),
  )
  const { globalFontScale, updateGlobalFontScale } = useSettingsFormValues()
  const isMenuShow = useSignalValue(isMenuShownStateSignal)
  const { goBack } = useSafeGoBack()
  const { toggleMoreDialog } = useMoreDialog()
  const { mutate } = useShowRemoveBookOnExitDialog({
    bookId,
    onSettled: () => {
      goBack()
    },
  })

  const onItemClick = useCallback(
    (
      item: Parameters<
        NonNullable<ComponentProps<typeof ReactReader>["onItemClick"]>
      >[0],
    ) => {
      if (item === "more") {
        toggleMoreDialog()
      }
      if (item === "back") {
        mutate()
      }
    },
    [toggleMoreDialog, mutate],
  )

  if (isBookError) {
    return <BookError bookId={bookId} manifestError={manifestError} />
  }

  return (
    <>
      <Box position="relative" height="100%" width="100%" overflow="hidden">
        {readerState !== "ready" && <BookLoading />}
        <ReactReader
          onItemClick={onItemClick}
          enableFloatingTime={localSettings.readerFloatingTime === "bottom"}
          reader={reader}
          quickMenuOpen={isMenuShow}
          onQuickMenuOpenChange={isMenuShownStateSignal.update}
          fontSize={globalFontScale ?? undefined}
          onFontSizeChange={(_scope, fontSize) => {
            updateGlobalFontScale(fontSize)
          }}
          enableFloatingProgress={
            localSettings.readerFloatingProgress === "bottom"
          }
        >
          <Box
            position="relative"
            height="100%"
            width="100%"
            ref={readerContainerRef}
          />
        </ReactReader>
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

const Effects = memo(
  ({
    bookId,
    isUsingWebStreamer,
    manifest,
    containerElement,
  }: {
    bookId: string
    isUsingWebStreamer?: boolean
    manifest?: Manifest
    containerElement?: HTMLElement | null
  }) => {
    useCreateReader({ bookId, isUsingWebStreamer })
    useLoadReader({
      bookId,
      containerElement,
      manifest,
    })

    useGestureHandler()
    useSyncBookProgress(bookId)

    return null
  },
)
