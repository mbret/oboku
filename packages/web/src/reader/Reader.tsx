/**
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js
 * @see https://github.com/pgaskin/ePubViewer/blob/gh-pages/script.js#L407-L469
 */
import { useEffect, FC, memo, useRef } from "react"
import { useBook } from "../books/states"
import { readerSignal } from "./states"
import { TopBar } from "./navigation/TopBar"
import { BottomBar } from "./navigation/BottomBar"
import { useGestureHandler } from "./gestures"
import { BookLoading } from "./BookLoading"
import { useSyncBookProgress } from "./progress/useSyncBookProgress"
import { FloatingBottom } from "./navigation/FloatingBottom"
import { usePersistReaderInstanceSettings } from "./settings/usePersistReaderSettings"
import { Notification } from "./Notification"
import { useReaderSettingsState } from "./settings/states"
import { useObserve, useSignalValue } from "reactjrx"
import { useManifest } from "./manifest/useManifest"
import { useCreateReader } from "./useCreateReader"
import { BookError } from "./BookError"

export const Reader: FC<{
  bookId: string
}> = memo(({ bookId }) => {
  const reader = useSignalValue(readerSignal)
  const readerState = useObserve(() => reader?.state$, [reader])
  const readerSettings = useReaderSettingsState()
  const { data: book } = useBook({
    id: bookId
  })
  const readerContainerRef = useRef<HTMLDivElement>(null)
  const isBookLoadedRef = useRef(false)
  const {
    data: manifest,
    isRarFile,
    error: manifestError
  } = useManifest(bookId)
  const isBookError = !!manifestError
  // We don't want to display overlay for comics / manga
  const showFloatingMenu =
    reader?.context.manifest?.renditionLayout !== "pre-paginated"

  useGestureHandler()
  useSyncBookProgress(bookId)
  usePersistReaderInstanceSettings()
  useCreateReader({ manifest, bookId, isRarFile })

  useEffect(() => {
    const containerElement = readerContainerRef.current

    if (
      !isBookLoadedRef.current &&
      reader &&
      manifest &&
      containerElement &&
      book
    ) {
      isBookLoadedRef.current = true

      reader.load({
        containerElement,
        manifest: {
          ...manifest
          // readingDirection: "ltr"
        },
        cfi: book.readingStateCurrentBookmarkLocation || undefined
      })
    }
  }, [manifest, book, reader])

  if (isBookError) {
    return <BookError bookId={bookId} manifestError={manifestError} />
  }

  return (
    <div
      style={{
        position: "relative",
        height: `100%`,
        width: `100%`
      }}
    >
      <div
        style={{
          height: `100%`,
          width: `100%`,
          position: "relative"
        }}
        ref={readerContainerRef}
      >
        {readerState === "idle" && <BookLoading />}
      </div>
      <Notification />
      {showFloatingMenu && (
        <FloatingBottom
          enableProgress={readerSettings.floatingProgress === "bottom"}
          enableTime={readerSettings.floatingTime === "bottom"}
        />
      )}
      <TopBar bookId={bookId} />
      <BottomBar bookId={bookId} />
    </div>
  )
})
