import { useMemo } from "react"
import type { Manifest } from "@prose-reader/shared"
import { createAppReader } from "./createAppReader"
import { localSettingsSignal } from "../settings/useLocalSettings"
import { getResourcePathFromUrl } from "./manifest/getResourcePathFromUrl.shared"
import { webStreamer } from "./streamer/webStreamer"
import { from, of } from "rxjs"
import pdfjsViewerInlineCss from "pdfjs-dist/web/pdf_viewer.css?inline"
import { type BookDocType, getBookmark } from "@oboku/shared"
import type { DeepReadonly } from "rxdb"

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
 * The `createReader` for `ReactReaderProvider`: `undefined` until the
 * manifest, the streamer mode, the KOReader document and the book to open are
 * known, then a function that changes only when one of the hook's inputs
 * does, since each new one makes the provider create a new reader. A reader
 * it creates prunes the web streamer once destroyed.
 */
export const useCreateReader = ({
  isUsingWebStreamer,
  bookId,
  manifest,
  koreaderDocument,
  book,
}: {
  isUsingWebStreamer?: boolean
  bookId: string
  manifest?: Manifest
  koreaderDocument?: string
  /** The book to open at its bookmark, `null` to open at the start. */
  book: DeepReadonly<BookDocType> | null | undefined
}) =>
  useMemo(
    function getCreateReaderOnceInputsAreKnown() {
      if (
        !manifest ||
        isUsingWebStreamer === undefined ||
        koreaderDocument === undefined ||
        book === undefined
      ) {
        return undefined
      }

      return function createReaderForBook() {
        const target = book
          ? getOpeningTarget({ book, koreaderDocument })
          : undefined
        const isEInkMode = localSettingsSignal.getValue().themeMode === "e-ink"

        const instance = createAppReader({
          manifest,
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

        instance.$.destroy$.subscribe(function pruneWebStreamerOnceDestroyed() {
          webStreamer.prune()
        })

        // @ts-expect-error
        window.reader = instance

        return instance
      }
    },
    [manifest, isUsingWebStreamer, bookId, book, koreaderDocument],
  )
