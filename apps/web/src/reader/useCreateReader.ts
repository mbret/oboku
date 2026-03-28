import { useEffect, useState } from "react"
import { SIGNAL_RESET, useSignalValue } from "reactjrx"
import { gesturesEnhancer } from "@prose-reader/enhancer-gestures"
import { createReader } from "@prose-reader/core"
import { galleryEnhancer } from "@prose-reader/enhancer-gallery"
import { searchEnhancer } from "@prose-reader/enhancer-search"
import { readerSignal } from "./states"
import { localSettingsSignal } from "../settings/useLocalSettings"
import { getResourcePathFromUrl } from "./manifest/getResourcePathFromUrl.shared"
import { webStreamer } from "./streamer/webStreamer"
import { from, of } from "rxjs"
import { refitEnhancer } from "@prose-reader/enhancer-refit"
import { audioEnhancer } from "@prose-reader/enhancer-audio"
import { pdfEnhancer } from "@prose-reader/enhancer-pdf"
import pdfjsViewerInlineCss from "pdfjs-dist/web/pdf_viewer.css?inline"

export const createAppReader = pdfEnhancer(
  audioEnhancer(
    refitEnhancer(
      galleryEnhancer(gesturesEnhancer(searchEnhancer(createReader))),
    ),
  ),
)

export const useCreateReader = ({
  isUsingWebStreamer,
  bookId,
}: {
  isUsingWebStreamer?: boolean
  bookId: string
}) => {
  const [isCreated, setIsCreated] = useState(false)
  const reader = useSignalValue(readerSignal)

  useEffect(() => {
    if (
      isUsingWebStreamer !== undefined &&
      !isCreated &&
      !readerSignal.getValue()
    ) {
      setIsCreated(true)

      const instance = createAppReader({
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

      // @ts-expect-error
      window.reader = instance

      readerSignal.update(instance)
    }
  }, [isUsingWebStreamer, isCreated, bookId])

  useEffect(() => {
    if (reader) {
      return () => {
        reader.destroy()

        readerSignal.update(SIGNAL_RESET)

        webStreamer.prune()
      }
    }
  }, [reader])
}
