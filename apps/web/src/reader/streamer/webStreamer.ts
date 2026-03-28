import { Streamer } from "@prose-reader/streamer"
import { getBookFile } from "../../download/getBookFile.shared"
import {
  getArchiveForRarFile,
  getArchiveForZipFile,
  isPdfFile,
  isRarFile,
} from "./archives.shared"
import { StreamerFileNotFoundError } from "../../errors/errors.shared"
import { onResourceError } from "./onResourceError.shared"
import { onManifestSuccess } from "./onManifestSuccess.shared"
import { createArchiveFromPdf } from "@prose-reader/enhancer-pdf"
import * as pdfjsLib from "pdfjs-dist"
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  pdfWorkerUrl,
  import.meta.url,
).toString()

export const webStreamer = new Streamer({
  /**
   * Some formats like PDF hold non-serializable resources (e.g. PDFDocumentProxy)
   * that must stay alive for the entire reading session. The streamer is pruned
   * explicitly on book unload instead.
   */
  cleanArchiveAfter: Infinity,
  getArchive: async (bookId) => {
    const file = await getBookFile(bookId)

    if (!file) {
      throw new StreamerFileNotFoundError(`FileNotFoundError`)
    }

    if (isRarFile(file)) {
      return await getArchiveForRarFile(file)
    }

    if (isPdfFile(file)) {
      return await createArchiveFromPdf(file.data, file.data.name)
    }

    const archive = await getArchiveForZipFile(file)

    return archive
  },
  onError: onResourceError,
  onManifestSuccess,
})
