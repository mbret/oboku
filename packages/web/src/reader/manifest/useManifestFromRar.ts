import { useQuery } from "reactjrx"
import { generateManifestFromArchive } from "@prose-reader/streamer"
import { getManifestBaseUrl } from "../streamer/getManifestBaseUrl.shared"
import { FileNotSupportedError } from "../errors.shared"
import { useArchiveForRarFile } from "../streamer/useArchiveForRarFile"

export const useManifestFromRar = ({
  bookId,
  enabled
}: {
  bookId?: string
  enabled?: boolean
}) => {
  const { data: archive, ...archiveRes } = useArchiveForRarFile({
    bookId,
    enabled
  })

  const res = useQuery({
    queryKey: ["reader/rar-streamer/manifest", { bookId }],
    queryFn: async () => {
      if (archive) {
        const manifest = await generateManifestFromArchive(archive, {
          baseUrl: getManifestBaseUrl(window.location.origin, bookId ?? "")
        })

        return manifest
      }

      throw new FileNotSupportedError()
    },
    gcTime: 0,
    staleTime: Infinity,
    enabled: enabled !== false && !!bookId && !!archive
  })

  return { ...res, error: archiveRes.error || res.error }
}
