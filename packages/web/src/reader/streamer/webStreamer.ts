import { Streamer } from "@prose-reader/streamer"
import { getBookFile } from "../../download/getBookFile.shared"
import {
  getArchiveForRarFile,
  getArchiveForZipFile,
  isRarFile
} from "./archives.shared"
import { StreamerFileNotFoundError } from "../../errors/errors.shared"
import { onResourceError } from "./onResourceError.shared"
import { onManifestSuccess } from "./onManifestSuccess.shared"

export const webStreamer = new Streamer({
  cleanArchiveAfter: 5 * 60 * 1000,
  getArchive: async (bookId) => {
    const file = await getBookFile(bookId)

    if (!file) {
      throw new StreamerFileNotFoundError(`FileNotFoundError`)
    }

    if (isRarFile(file)) {
      return await getArchiveForRarFile(file)
    }

    const archive = await getArchiveForZipFile(file)

    return archive
  },
  onError: onResourceError,
  onManifestSuccess
})
