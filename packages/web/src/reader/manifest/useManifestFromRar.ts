import "../../archive"
import { getBookFile } from "../../download/getBookFile.shared"
import { useQuery } from "reactjrx"
import { getArchiveForRarFile } from "../streamer/getArchiveForFile.shared"
import { generateManifestFromArchive } from "@prose-reader/streamer"
import { getManifestBaseUrl } from "../streamer/getManifestBaseUrl.shared"
import { FileNotSupportedError } from "../errors.shared"

export const useManifestFromRar = ({
  bookId,
  enabled
}: {
  bookId?: string
  enabled?: boolean
}) =>
  useQuery({
    queryKey: ["reader/rar-streamer/manifest", { bookId }],
    queryFn: async () => {
      const file = await getBookFile(bookId ?? "")
      const normalizedName = file?.name.toLowerCase()

      if (file && normalizedName?.endsWith(`.cbr`)) {
        const archive = await getArchiveForRarFile(file)

        const manifest = await generateManifestFromArchive(archive, {
          baseUrl: getManifestBaseUrl(window.location.origin, bookId ?? "")
        })

        return manifest
      }

      throw new FileNotSupportedError()
    },
    staleTime: Infinity,
    enabled: enabled !== false && !!bookId
  })
