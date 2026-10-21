import { type RefObject, useEffect } from "react"
import { SIGNAL_RESET } from "reactjrx"
import type { Manifest } from "@prose-reader/shared"
import { createAppReader } from "./createAppReader"
import { readerSignal } from "./states"
import { localSettingsSignal } from "../settings/useLocalSettings"
import { getResourcePathFromUrl } from "./manifest/getResourcePathFromUrl.shared"
import { webStreamer } from "./streamer/webStreamer"
import { from, of } from "rxjs"
import pdfjsViewerInlineCss from "pdfjs-dist/web/pdf_viewer.css?inline"
import { createBookQueryOptions } from "../books/states"
import { useEnsureQueryData$ } from "../queries/useEnsureQueryData$"

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
  const { data: bookOnce } = useEnsureQueryData$(
    createBookQueryOptions({ id: isPreview ? undefined : bookId }),
  )
  const isRestoredLocationReady = isPreview || !!bookOnce

  useEffect(
    function createReaderForBook() {
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
        : bookOnce?.readingStateCurrentBookmarkLocation || undefined
      const isEInkMode = localSettingsSignal.getValue().themeMode === "e-ink"

      const instance = createAppReader({
        manifest,
        target: cfi ? { type: "cfi", value: cfi } : undefined,
        ...(isEInkMode && {
          pageTurnAnimation: "none",
        }),
        gestures: {
          ...(isEInkMode && {
            panNavigation: "swipe",
          }),
        },
        pdf: {
          pdfjsViewerInlineCss,
          getArchiveForItem: function getPdfArchiveForItem(item) {
            if (!item.href.endsWith(`pdf`)) {
              return of(undefined)
            }

            return webStreamer.accessArchiveWithoutLock(bookId)
          },
        },
        ...(isUsingWebStreamer && {
          getResource: function fetchResourceFromWebStreamer(item) {
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

      return function destroyReader() {
        instance.destroy()

        readerSignal.update(SIGNAL_RESET)

        webStreamer.prune()
      }
    },
    [
      manifest,
      isUsingWebStreamer,
      isPreview,
      isRestoredLocationReady,
      bookId,
      bookOnce,
      containerRef,
    ],
  )
}
