import { ServiceWorkerStreamer } from "@prose-reader/streamer"
import { STREAMER_URL_PREFIX } from "../../constants.shared"
import { getBookFile } from "../../download/getBookFile.shared"
import { getArchiveForZipFile } from "./getArchiveForFile.shared"
import {
  StreamerFileNotFoundError,
  StreamerFileNotSupportedError
} from "../../errors/errors.shared"
import { onResourceError } from "./onResourceError.shared"
import { onManifestSuccess } from "./onManifestSuccess.shared"

export const swStreamer = new ServiceWorkerStreamer({
  cleanArchiveAfter: 5 * 60 * 1000,
  getUriInfo: (event) => {
    const url = new URL(event.request.url)
    const shouldIntercept = url.pathname.startsWith(`/${STREAMER_URL_PREFIX}`)

    if (!shouldIntercept) return undefined

    return {
      baseUrl: `${url.origin}/${STREAMER_URL_PREFIX}`
    }
  },
  getArchive: async (bookId) => {
    const file = await getBookFile(bookId)

    if (!file) {
      throw new StreamerFileNotFoundError(`FileNotFoundError`)
    }

    const newArchive = await getArchiveForZipFile(file)

    if (!newArchive) {
      throw new StreamerFileNotSupportedError(`FileNotSupportedError`)
    }

    return newArchive
  },
  onError: onResourceError,
  onManifestSuccess
})