import { Streamer } from "@prose-reader/streamer"
import { getBookFile } from "../../download/getBookFile.shared"
import { getArchiveForRarFile } from "./getArchiveForFile.shared"
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

    const newArchive = await getArchiveForRarFile(file)

    return newArchive
  },
  onError: onResourceError,
  onManifestSuccess
})
