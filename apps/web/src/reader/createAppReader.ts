import { cbzEnhancer } from "@prose-reader/cbz"
import { createReader } from "@prose-reader/core"
import { audioEnhancer } from "@prose-reader/enhancer-audio"
import { galleryEnhancer } from "@prose-reader/enhancer-gallery"
import { gesturesEnhancer } from "@prose-reader/enhancer-gestures"
import { koreaderEnhancer } from "@prose-reader/enhancer-koreader"
import { pdfEnhancer } from "@prose-reader/enhancer-pdf"
import { refitEnhancer } from "@prose-reader/enhancer-refit"
import { searchEnhancer } from "@prose-reader/enhancer-search"

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
