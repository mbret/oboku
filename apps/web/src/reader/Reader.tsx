/**
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js#L407-L469
 */
import { memo, type RefObject, useRef } from "react"
import { readerSignal } from "./states"
import { type BookOpening, BookLoading } from "./BookLoading"
import { useSyncBookProgress } from "./progress/useSyncBookProgress"
import { useSyncReaderTheme } from "./theme/useReaderTheme"
import { useObserve, useSignalValue } from "reactjrx"
import { useManifest } from "./manifest/useManifest"
import { useCreateReader } from "./useCreateReader"
import { useBookToOpen } from "./useBookToOpen"
import { BookError } from "./BookError"
import { Box } from "@mui/material"
import type { Manifest } from "@prose-reader/shared"
import type { BookDocType } from "@oboku/shared"
import type { DeepReadonly } from "rxdb"
import { ReactReader, type ReactReaderProps } from "@prose-reader/react-reader"
import "@prose-reader/react-reader/index.css"
import { useSafeGoBack } from "../navigation/useSafeGoBack"
import { useOpenMoreDialog } from "./navigation/MoreDialog"
import { useLocalSettings } from "../settings/useLocalSettings"
import { useReaderSettings } from "./settings/useReaderSettings"
import { useShowBookFinishedDialog } from "./navigation/useShowBookFinishedDialog"
import { useKoreaderPositionCheck } from "../integrations/koreader/client/useKoreaderPositionCheck"

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
  const {
    data: { isUsingWebStreamer, manifest, koreaderDocument } = {},
    error: manifestError,
  } = useManifest(bookId)
  const isBookError = !!manifestError
  const koreaderPositionCheck = useKoreaderPositionCheck({
    bookId,
    koreaderDocument,
    enabled: !isPreview,
  })
  const opening: BookOpening = manifest
    ? koreaderPositionCheck
    : { status: "loadingFile" }
  const bookToOpen = useBookToOpen({
    bookId,
    isPreview,
    mayOpen: opening.status === "done",
  })
  const localSettings = useLocalSettings([
    "readerFloatingProgress",
    "readerFloatingTime",
  ])
  const { readerSettings, updateReaderSettings } = useReaderSettings()
  const { goBack } = useSafeGoBack()
  const openMoreDialog = useOpenMoreDialog()
  const { showBookFinishedDialogOnClose } = useShowBookFinishedDialog({
    bookId,
    onClose: goBack,
    enabled: !isPreview,
  })

  function onItemClick(
    item: Parameters<NonNullable<ReactReaderProps["onItemClick"]>>[0],
  ) {
    if (item === "more") {
      openMoreDialog()
    }
    if (item === "back") {
      showBookFinishedDialogOnClose()
    }
  }

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
          settings={readerSettings}
          onSettingsChange={updateReaderSettings}
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
      {!isReaderMounted && <BookLoading opening={opening} />}
      <Effects
        bookId={bookId}
        isPreview={isPreview}
        isUsingWebStreamer={isUsingWebStreamer}
        manifest={manifest}
        koreaderDocument={koreaderDocument}
        book={bookToOpen}
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
  koreaderDocument,
  book,
  containerRef,
}: {
  bookId: string
  isPreview: boolean
  isUsingWebStreamer?: boolean
  manifest?: Manifest
  koreaderDocument?: string
  book: DeepReadonly<BookDocType> | null | undefined
  containerRef: RefObject<HTMLElement | null>
}) {
  useCreateReader({
    bookId,
    isUsingWebStreamer,
    manifest,
    koreaderDocument,
    book,
    containerRef,
  })
  useSyncBookProgress(bookId, { enabled: !isPreview, koreaderDocument })
  useSyncReaderTheme()

  return null
})
