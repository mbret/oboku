import { useQuery } from "@tanstack/react-query"
import { getBookFile } from "../../../download/getBookFile.shared"
import { Logger } from "../../../debug/logger.shared"
import { readArchiveMetadataFromFile } from "./archiveFile"

export type FileInspection = {
  fileName: string
  hasComicInfo: boolean
  hasOpf: boolean
  comicInfoIsbn: string | undefined
  opfIsbn: string | undefined
  metadataReadFailed: boolean
}

export const useFileInspection = ({
  bookId,
  enabled,
}: {
  bookId: string | undefined
  enabled: boolean
}) =>
  useQuery({
    queryKey: ["metadataFixer", "fileInspection", bookId] as const,
    enabled: enabled && !!bookId,
    networkMode: "always",
    staleTime: 0,
    queryFn: async (): Promise<FileInspection | null> => {
      if (!bookId) return null

      const result = await getBookFile(bookId)
      if (!result) return null

      const file = result.data

      Logger.info("[metadataFixer] file inspection", {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      })

      try {
        const metadata = await readArchiveMetadataFromFile(file)

        return {
          fileName: file.name,
          hasComicInfo: metadata.hasComicInfo,
          hasOpf: metadata.hasOpf,
          comicInfoIsbn: metadata.comicInfo?.isbn,
          opfIsbn: metadata.opf?.isbn,
          metadataReadFailed: false,
        }
      } catch {
        return {
          fileName: file.name,
          hasComicInfo: false,
          hasOpf: false,
          comicInfoIsbn: undefined,
          opfIsbn: undefined,
          metadataReadFailed: true,
        }
      }
    },
  })
