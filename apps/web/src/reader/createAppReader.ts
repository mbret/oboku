import { cbzEnhancer } from "@prose-reader/cbz"
import { createReader } from "@prose-reader/core"
import { annotationsEnhancer } from "@prose-reader/enhancer-annotations"
import { audioEnhancer } from "@prose-reader/enhancer-audio"
import { galleryEnhancer } from "@prose-reader/enhancer-gallery"
import { gesturesEnhancer } from "@prose-reader/enhancer-gestures"
import { koreaderEnhancer } from "@prose-reader/enhancer-koreader"
import { pdfEnhancer } from "@prose-reader/enhancer-pdf"
import { refitEnhancer } from "@prose-reader/enhancer-refit"
import { searchEnhancer } from "@prose-reader/enhancer-search"

/**
 * Creates the reader of a preview, with the enhancers that every reader of
 * the app has. Its type is the one that every reader of the app shares, which
 * `Register` declares.
 */
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

/**
 * Creates the reader of a reading session: the reader of a preview, with the
 * enhancers that hold reading data or show a control for it. They follow
 * `getUsesReadingData` in `./mode`.
 */
export const createReadingSessionReader = annotationsEnhancer(createAppReader)

declare module "@prose-reader/react-reader" {
  interface Register {
    reader: ReturnType<typeof createAppReader>
  }
}
