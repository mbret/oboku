/**
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js#L407-L469
 */
import { memo, useEffect } from "react"
import { type BookOpening, BookLoading } from "./BookLoading"
import { useSyncBookProgress } from "./progress/useSyncBookProgress"
import { useObserve } from "reactjrx"
import { useManifest } from "./manifest/useManifest"
import { useCreateReader } from "./useCreateReader"
import { useBookToOpen } from "./useBookToOpen"
import { BookError } from "./BookError"
import { Box } from "@mui/material"
import {
  ReactReader,
  ReactReaderProvider,
  type ReactReaderProps,
  useReader,
} from "@prose-reader/react-reader"
import "@prose-reader/react-reader/index.css"
import { useSafeGoBack } from "../navigation/useSafeGoBack"
import { useOpenMoreDialog } from "./navigation/MoreDialog"
import { useLocalSettings } from "../settings/useLocalSettings"
import { useReaderSettings } from "./settings/useReaderSettings"
import { useShowBookFinishedDialog } from "./navigation/useShowBookFinishedDialog"
import { useKoreaderPositionCheck } from "../integrations/koreader/client/useKoreaderPositionCheck"
import { webStreamer } from "./streamer/webStreamer"

export const Reader = memo(function Reader({
  bookId,
  isPreview,
}: {
  bookId: string
  isPreview: boolean
}) {
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
  const createReader = useCreateReader({
    bookId,
    isUsingWebStreamer,
    manifest,
    koreaderDocument,
    book: bookToOpen,
  })
  const { readerSettings, updateReaderSettings } = useReaderSettings()

  if (isBookError) {
    return <BookError bookId={bookId} manifestError={manifestError} />
  }

  return (
    <ReactReaderProvider
      createReader={createReader}
      settings={readerSettings}
      onSettingsChange={updateReaderSettings}
    >
      <ReaderView
        bookId={bookId}
        isPreview={isPreview}
        opening={opening}
        koreaderDocument={koreaderDocument}
      />
    </ReactReaderProvider>
  )
})

const ReaderView = memo(function ReaderView({
  bookId,
  isPreview,
  opening,
  koreaderDocument,
}: {
  bookId: string
  isPreview: boolean
  opening: BookOpening
  koreaderDocument?: string
}) {
  const reader = useReader()
  const { data: isReaderMounted } = useObserve(() => reader?.mounted$, [reader])
  const localSettings = useLocalSettings([
    "readerFloatingProgress",
    "readerFloatingTime",
  ])
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
          enableFloatingProgress={
            localSettings.readerFloatingProgress === "bottom"
          }
        />
      </Box>
      {/* Need to be after reader container so it shows on top and hide loading */}
      {!isReaderMounted && <BookLoading opening={opening} />}
      <Effects
        bookId={bookId}
        isPreview={isPreview}
        koreaderDocument={koreaderDocument}
      />
    </>
  )
})

const Effects = memo(function Effects({
  bookId,
  isPreview,
  koreaderDocument,
}: {
  bookId: string
  isPreview: boolean
  koreaderDocument?: string
}) {
  const reader = useReader()

  useSyncBookProgress(bookId, { enabled: !isPreview, koreaderDocument })

  useEffect(
    function pruneWebStreamerOnceReaderIsGone() {
      if (!reader) return

      return function pruneWebStreamer() {
        webStreamer.prune()
      }
    },
    [reader],
  )

  return null
})
