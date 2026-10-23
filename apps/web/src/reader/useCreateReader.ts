import { type RefObject, useEffect } from "react"
import { SIGNAL_RESET } from "reactjrx"
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
import { koreaderEnhancer } from "@prose-reader/enhancer-koreader"
import { type BookDocType, getBookmark } from "@oboku/shared"
import type { DeepReadonly } from "rxdb"

export const createAppReader = koreaderEnhancer(
  pdfEnhancer(
    audioEnhancer(
      refitEnhancer(
        galleryEnhancer(
          gesturesEnhancer(searchEnhancer(cbzEnhancer(createReader))),
        ),
      ),
    ),
  ),
)

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
  useEffect(() => {
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

    const instance = createAppReader({
      manifest,
      target,
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
    bookId,
    book,
    koreaderDocument,
    containerRef,
  ])
}
