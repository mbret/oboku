import { useQuery } from "@tanstack/react-query"
import { getBookFile } from "../../download/getBookFile.shared"
import { Logger } from "../../debug/logger.shared"
import {
  loadArchive,
  readArchiveMetadataFromSource,
} from "./metadata/archiveFile"
import {
  listImageEntries,
  measureAverageImageResolution,
  type ImageResolution,
} from "./content/images"

export const FILE_INSPECTION_QUERY_KEY = ["metadataFixer", "fileInspection"]

export type FileInspection = {
  fileName: string
  fileSize: number
  imageCount: number
  imageBytes: number
  averageImageResolution: ImageResolution | undefined
  hasComicInfo: boolean
  hasOpf: boolean
  comicInfoIsbn: string | undefined
  opfIsbn: string | undefined
  metadataReadFailed: boolean
}

const inspectContent = (
  entries: ReturnType<typeof listImageEntries>,
): { imageCount: number; imageBytes: number } => ({
  imageCount: entries.length,
  imageBytes: entries.reduce((total, { size }) => total + (size ?? 0), 0),
})

export const useFileInspection = ({
  bookId,
  enabled,
}: {
  bookId: string | undefined
  enabled: boolean
}) =>
  useQuery({
    queryKey: [...FILE_INSPECTION_QUERY_KEY, bookId] as const,
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

      const { zip, archive } = await loadArchive(file)
      const imageEntries = listImageEntries(zip)
      const { imageCount, imageBytes } = inspectContent(imageEntries)
      const averageImageResolution =
        await measureAverageImageResolution(imageEntries)

      try {
        const metadata = await readArchiveMetadataFromSource(archive)

        return {
          fileName: file.name,
          fileSize: file.size,
          imageCount,
          imageBytes,
          averageImageResolution,
          hasComicInfo: metadata.hasComicInfo,
          hasOpf: metadata.hasOpf,
          comicInfoIsbn: metadata.comicInfo?.isbn,
          opfIsbn: metadata.opf?.isbn,
          metadataReadFailed: false,
        }
      } catch {
        return {
          fileName: file.name,
          fileSize: file.size,
          imageCount,
          imageBytes,
          averageImageResolution,
          hasComicInfo: false,
          hasOpf: false,
          comicInfoIsbn: undefined,
          opfIsbn: undefined,
          metadataReadFailed: true,
        }
      }
    },
  })
