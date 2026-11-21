/**
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js#L407-L469
 */
import { memo, useEffect } from "react"
import { type BookOpening, BookLoading } from "./BookLoading"
import { useSyncBookProgress } from "./progress/useSyncBookProgress"
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
import { useReaderAnnotations } from "./annotations/useReaderAnnotations"
import { useShowBookFinishedDialog } from "./navigation/useShowBookFinishedDialog"
import { useKoreaderPositionCheck } from "../integrations/koreader/client/useKoreaderPositionCheck"
import { webStreamer } from "./streamer/webStreamer"
import type { ReaderInstance } from "./states"

declare global {
  interface Window {
    reader?: ReaderInstance
  }
}

export const Reader = memo(function Reader({
  bookId,
  usesReadingData,
}: {
  bookId: string
  usesReadingData: boolean
}) {
  useEffect(function releaseBookArchivesOnLeave() {
    return function pruneWebStreamer() {
      webStreamer.prune()
    }
  }, [])

  const {
    data: { isUsingWebStreamer, manifest, koreaderDocument } = {},
    error: manifestError,
  } = useManifest(bookId)
  const isBookError = !!manifestError
  const koreaderPositionCheck = useKoreaderPositionCheck({
    bookId,
    koreaderDocument,
    enabled: usesReadingData,
  })
  const opening: BookOpening = manifest
    ? koreaderPositionCheck
    : { status: "loadingFile" }
  const bookToOpen = useBookToOpen({
    bookId,
    usesReadingData,
    mayOpen: opening.status === "done",
  })
  const createReader = useCreateReader({
    bookId,
    isUsingWebStreamer,
    manifest,
    koreaderDocument,
    book: bookToOpen,
    usesReadingData,
  })
  const { readerSettings, defaultReaderSettings, updateReaderSettings } =
    useReaderSettings()
  const readerAnnotations = useReaderAnnotations({
    bookId,
    enabled: usesReadingData,
  })

  if (isBookError) {
    return <BookError bookId={bookId} manifestError={manifestError} />
  }

  return (
    <ReactReaderProvider
      createReader={createReader}
      settings={readerSettings}
      defaultSettings={defaultReaderSettings}
      onSettingsChange={updateReaderSettings}
      {...readerAnnotations}
    >
      <ReaderView
        bookId={bookId}
        usesReadingData={usesReadingData}
        opening={opening}
      />
      <Effects
        bookId={bookId}
        usesReadingData={usesReadingData}
        koreaderDocument={koreaderDocument}
      />
    </ReactReaderProvider>
  )
})

function ReaderView({
  bookId,
  usesReadingData,
  opening,
}: {
  bookId: string
  usesReadingData: boolean
  opening: BookOpening
}) {
  const reader = useReader()
  const localSettings = useLocalSettings([
    "readerFloatingProgress",
    "readerFloatingTime",
  ])
  const { goBack } = useSafeGoBack()
  const openMoreDialog = useOpenMoreDialog()
  const { showBookFinishedDialogOnClose } = useShowBookFinishedDialog({
    bookId,
    onClose: goBack,
    enabled: usesReadingData,
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
      {!reader && <BookLoading opening={opening} />}
    </>
  )
}

const Effects = memo(function Effects({
  bookId,
  usesReadingData,
  koreaderDocument,
}: {
  bookId: string
  usesReadingData: boolean
  koreaderDocument?: string
}) {
  const reader = useReader()

  useSyncBookProgress(bookId, { enabled: usesReadingData, koreaderDocument })

  useEffect(
    function exposeReaderOnWindow() {
      if (!reader) return

      window.reader = reader

      return function removeReaderFromWindow() {
        delete window.reader
      }
    },
    [reader],
  )

  return null
})
