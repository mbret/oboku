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
import { type BookDocType, getBookmark } from "@oboku/shared"
import type { DeepReadonly } from "rxdb"
import { getReaderTheme } from "./theme/readerTheme"

type OpeningTarget = Parameters<typeof createAppReader>[0]["target"]

const getOpeningTarget = ({
  book,
  koreaderDocument,
}: {
  book: DeepReadonly<BookDocType>
  koreaderDocument: string
}): OpeningTarget => {
  const bookmark = getBookmark(book)

  if (bookmark?.cfi !== undefined) {
    return { type: "cfi", value: bookmark.cfi }
  }

  const isKoreaderBookmarkOfOpenedFile =
    bookmark?.koreader.document === koreaderDocument

  return isKoreaderBookmarkOfOpenedFile
    ? { type: "koreaderProgress", value: bookmark.koreader.progress }
    : undefined
}

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
  manifest,
  koreaderDocument,
  book,
  containerRef,
}: {
  isUsingWebStreamer?: boolean
  bookId: string
  manifest?: Manifest
  koreaderDocument?: string
  /**
   * The book to open at its bookmark, `null` to open at the start. The reader
   * waits while it is `undefined`, and is created again whenever it changes.
   */
  book: DeepReadonly<BookDocType> | null | undefined
  containerRef: RefObject<HTMLElement | null>
}) => {
  useEffect(
    function createReaderForBook() {
      const containerElement = containerRef.current

      if (
        !manifest ||
        !containerElement ||
        isUsingWebStreamer === undefined ||
        koreaderDocument === undefined ||
        book === undefined
      ) {
        return
      }

      const target = book
        ? getOpeningTarget({ book, koreaderDocument })
        : undefined
      const isEInkMode = localSettingsSignal.getValue().themeMode === "e-ink"

      const instance = createAppReader({
        manifest,
        theme: getReaderTheme(),
        target,
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
      bookId,
      book,
      koreaderDocument,
      containerRef,
    ],
  )
}
