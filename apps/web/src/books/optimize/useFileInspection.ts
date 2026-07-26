import { skipToken, useQuery } from "@tanstack/react-query"
import { type Archive, resolveArchive } from "@prose-reader/archive-reader"
import { getBookFile } from "../../download/getBookFile.shared"
import { Logger } from "../../debug/logger.shared"
import { createArchiveFromZipJs } from "@prose-reader/archive-reader/archives/createArchiveFromZipJs"
import { BlobReader, ZipReader } from "@zip.js/zip.js"
import {
  listImageEntries,
  measureAverageImageResolution,
  type ImageResolution,
} from "@oboku/archive-metadata/web"

export const FILE_INSPECTION_QUERY_KEY = ["metadataFixer", "fileInspection"]

const resolveBookArchive = (archive: Archive) =>
  resolveArchive(archive, { include: ["metadata", "sources"] })

export type ResolvedBookArchive = Awaited<ReturnType<typeof resolveBookArchive>>

export type FileInspection = {
  fileName: string
  fileSize: number
  imageCount: number
  imageBytes: number
  averageImageResolution: ImageResolution | undefined
  resolvedArchive: ResolvedBookArchive
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

          Logger.info("[metadataFixer] file", {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
          })

          const archive = await createArchiveFromZipJs(
            new ZipReader(new BlobReader(file)),
          )

          try {
            const imageRecords = listImageEntries(archive)
            const { imageCount, imageBytes } = inspectContent(imageRecords)
            const averageImageResolution =
              await measureAverageImageResolution(imageRecords)
            const inspection: FileInspection = {
              fileName: file.name,
              fileSize: file.size,
              imageCount,
              imageBytes,
              averageImageResolution,
              resolvedArchive: await resolveBookArchive(archive),
            }

            Logger.info("[metadataFixer] file inspection", inspection)

            return inspection
          } finally {
            await archive.close()
          }
        }
      : skipToken,
  })
