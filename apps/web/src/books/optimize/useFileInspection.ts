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

/**
 * Inspects the locally cached book file in a single pass: file stats, image
 * stats, and embedded metadata (OPF / ComicInfo).
 *
 * Inspection is intentionally all-or-nothing. A malformed OPF or ComicInfo.xml
 * makes `readArchiveMetadataFromSource` reject, which fails the whole query and
 * surfaces the file as unsupported/corrupt in `OptimizeStep` — even though
 * image counting and compression could technically still run. We treat an
 * archive whose declared metadata cannot be parsed as untrustworthy rather than
 * presenting an optimize UI built on partially-read data.
 *
 * Before isolating metadata parse failures into the metadata fields here, also
 * design the partial-state UX (`MetadataTab`, `MetadataForm`, the action bar),
 * otherwise the recovered content path has nowhere to surface.
 */
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
