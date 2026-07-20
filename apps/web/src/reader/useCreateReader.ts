import { type RefObject, useEffect } from "react"
import { SIGNAL_RESET, useLiveRef } from "reactjrx"
import { gesturesEnhancer } from "@prose-reader/enhancer-gestures"
import { createReader } from "@prose-reader/core"
import { galleryEnhancer } from "@prose-reader/enhancer-gallery"
import { searchEnhancer } from "@prose-reader/enhancer-search"
import type { Manifest } from "@prose-reader/shared"
import { readerSignal } from "./states"
import { localSettingsSignal } from "../settings/useLocalSettings"
import { getResourcePathFromUrl } from "./manifest/getResourcePathFromUrl.shared"
import { webStreamer } from "./streamer/webStreamer"
import { from, of } from "rxjs"
import { refitEnhancer } from "@prose-reader/enhancer-refit"
import { audioEnhancer } from "@prose-reader/enhancer-audio"
import { pdfEnhancer } from "@prose-reader/enhancer-pdf"
import pdfjsViewerInlineCss from "pdfjs-dist/web/pdf_viewer.css?inline"
import { cbzEnhancer } from "@prose-reader/cbz"
import { useBook } from "../books/states"

export const createAppReader = pdfEnhancer(
  audioEnhancer(
    refitEnhancer(
      galleryEnhancer(
        gesturesEnhancer(searchEnhancer(cbzEnhancer(createReader))),
      ),
    ),
  ),
)

/**
 * A reader lives for a single book: we create it once we have the manifest,
 * the restored reading location and the container, mount it right away and
 * destroy it on cleanup. Because destroy() is the true inverse of
 * create+mount, this effect is naturally safe with react strict mode
 * re-running effects.
 */
export const useCreateReader = ({
  isUsingWebStreamer,
  bookId,
  isPreview,
  manifest,
  containerRef,
}: {
  isUsingWebStreamer?: boolean
  bookId: string
  isPreview: boolean
  manifest?: Manifest
  containerRef: RefObject<HTMLElement | null>
}) => {
  const { data: book } = useBook({
    id: bookId,
    enabled: (query) => {
      if (isPreview) return false

      const hasNoResultYet = query.state.data === undefined

      return hasNoResultYet
    },
  })
  const isRestoredLocationReady = isPreview || !!book
  // The reader restores the location it was created with. Later location
  // writes (progress sync) flow back into the book query and must not
  // destroy/recreate the reader, so the book stays out of the effect deps.
  const bookRef = useLiveRef(book)

  useEffect(() => {
    const containerElement = containerRef.current

    if (
      !manifest ||
      !containerElement ||
      isUsingWebStreamer === undefined ||
      !isRestoredLocationReady
    ) {
      return
    }

    const cfi = isPreview
      ? undefined
      : bookRef.current?.readingStateCurrentBookmarkLocation || undefined

    const instance = createAppReader({
      manifest,
      ...(cfi ? { cfi } : {}),
      ...(localSettingsSignal.getValue().themeMode === "e-ink" && {
        pageTurnAnimation: "none",
      }),
      gestures: {
        ...(localSettingsSignal.getValue().themeMode === "e-ink" && {
          panNavigation: "swipe",
        }),
      },
      pdf: {
        pdfjsViewerInlineCss,
        getArchiveForItem: (item) => {
          if (!item.href.endsWith(`pdf`)) {
            return of(undefined)
          }

          return webStreamer.accessArchiveWithoutLock(bookId)
        },
      },
      ...(isUsingWebStreamer && {
        getResource: (item) => {
          const resourcePath = getResourcePathFromUrl(item.href)

          return from(
            webStreamer.fetchResource({
              key: bookId,
              resourcePath,
            }),
          )
        },
      }),
    })

    instance.mount(containerElement)

    // @ts-expect-error
    window.reader = instance

    readerSignal.update(instance)

    return () => {
      instance.destroy()

      readerSignal.update(SIGNAL_RESET)

      webStreamer.prune()
    }
  }, [
    manifest,
    isUsingWebStreamer,
    isPreview,
    isRestoredLocationReady,
    bookId,
    bookRef,
    containerRef,
  ])
}
