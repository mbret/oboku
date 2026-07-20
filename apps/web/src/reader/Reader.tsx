/**
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js#L407-L469
 */
import {
  type ComponentProps,
  memo,
  type RefObject,
  useCallback,
  useRef,
} from "react"
import { readerSignal } from "./states"
import { BookLoading } from "./BookLoading"
import { useSyncBookProgress } from "./progress/useSyncBookProgress"
import { useObserve, useSignalValue } from "reactjrx"
import { useManifest } from "./manifest/useManifest"
import { useCreateReader } from "./useCreateReader"
import { BookError } from "./BookError"
import { Box } from "@mui/material"
import type { Manifest } from "@prose-reader/shared"
import { ReactReader } from "@prose-reader/react-reader"
import "@prose-reader/react-reader/index.css"
import { useSafeGoBack } from "../navigation/useSafeGoBack"
import { useOpenMoreDialog } from "./navigation/MoreDialog"
import { useLocalSettings } from "../settings/useLocalSettings"
import { useSettingsFormValues } from "./settings/useSettingsFormValues"
import { useShowBookFinishedDialog } from "./navigation/useShowBookFinishedDialog"

export const Reader = memo(function Reader({
  bookId,
  isPreview,
}: {
  bookId: string
  isPreview: boolean
}) {
  const reader = useSignalValue(readerSignal)
  const { data: isReaderMounted } = useObserve(() => reader?.mounted$, [reader])
  const readerContainerRef = useRef<HTMLDivElement>(null)
  const { data: { isUsingWebStreamer, manifest } = {}, error: manifestError } =
    useManifest(bookId)
  const isBookError = !!manifestError
  const localSettings = useLocalSettings([
    "readerFloatingProgress",
    "readerFloatingTime",
  ])
  const { globalFontScale, updateGlobalFontScale } = useSettingsFormValues()
  const { goBack } = useSafeGoBack()
  const openMoreDialog = useOpenMoreDialog()
  const { showBookFinishedDialogOnClose } = useShowBookFinishedDialog({
    bookId,
    onClose: goBack,
    enabled: !isPreview,
  })

  const onItemClick = useCallback(
    (
      item: Parameters<
        NonNullable<ComponentProps<typeof ReactReader>["onItemClick"]>
      >[0],
    ) => {
      if (item === "more") {
        openMoreDialog()
      }
      if (item === "back") {
        showBookFinishedDialogOnClose()
      }
    },
    [openMoreDialog, showBookFinishedDialogOnClose],
  )

  if (isBookError) {
    return <BookError bookId={bookId} manifestError={manifestError} />
  }

  return (
    <>
      <Box
        sx={{
          position: "relative",
          height: "100%",
          width: "100%",
          overflow: "hidden",
        }}
      >
        <ReactReader
          onItemClick={onItemClick}
          enableFloatingTime={localSettings.readerFloatingTime === "bottom"}
          reader={reader}
          fontSize={globalFontScale ?? undefined}
          onFontSizeChange={(_scope, fontSize) => {
            updateGlobalFontScale(fontSize)
          }}
          enableFloatingProgress={
            localSettings.readerFloatingProgress === "bottom"
          }
        >
          <Box
            ref={readerContainerRef}
            sx={{
              position: "relative",
              height: "100%",
              width: "100%",
            }}
          />
        </ReactReader>
      </Box>
      {/* Need to be after reader container so it shows on top and hide loading */}
      {!isReaderMounted && <BookLoading />}
      <Effects
        bookId={bookId}
        isPreview={isPreview}
        isUsingWebStreamer={isUsingWebStreamer}
        manifest={manifest}
        containerRef={readerContainerRef}
      />
    </>
  )
})

const Effects = memo(function Effects({
  bookId,
  isPreview,
  isUsingWebStreamer,
  manifest,
  containerRef,
}: {
  bookId: string
  isPreview: boolean
  isUsingWebStreamer?: boolean
  manifest?: Manifest
  containerRef: RefObject<HTMLElement | null>
}) {
  useCreateReader({
    bookId,
    isPreview,
    isUsingWebStreamer,
    manifest,
    containerRef,
  })
  useSyncBookProgress(bookId, { enabled: !isPreview })

  return null
})
