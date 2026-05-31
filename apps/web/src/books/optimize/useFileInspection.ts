import { skipToken, useQuery } from "@tanstack/react-query"
import { getBookFile } from "../../download/getBookFile.shared"
import { Logger } from "../../debug/logger.shared"
import { loadArchive } from "./loadArchive"
import { readArchiveMetadataFromSource } from "./metadata/archiveFile"
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
}

const inspectContent = (
  records: ReturnType<typeof listImageEntries>,
): { imageCount: number; imageBytes: number } => ({
  imageCount: records.length,
  imageBytes: records.reduce((total, { size }) => total + size, 0),
})

export const useFileInspection = (bookId: string | undefined) =>
  useQuery({
    queryKey: [...FILE_INSPECTION_QUERY_KEY, bookId] as const,
    networkMode: "always",
    staleTime: 0,
    refetchOnWindowFocus: false,
    queryFn: bookId
      ? async (): Promise<FileInspection> => {
          const result = await getBookFile(bookId)

          if (!result) {
            throw new Error(`No cached file for book ${bookId}`)
          }

          const file = result.data

          Logger.info("[metadataFixer] file inspection", {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
          })

          const { archive } = await loadArchive(file)
          const imageRecords = listImageEntries(archive)
          const { imageCount, imageBytes } = inspectContent(imageRecords)
          const averageImageResolution =
            await measureAverageImageResolution(imageRecords)
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
          }
        }
      : skipToken,
  })
