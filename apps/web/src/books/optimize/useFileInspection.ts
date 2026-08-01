import { skipToken, useQuery } from "@tanstack/react-query"
import { type Archive, resolveArchive } from "@prose-reader/archive-reader"
import { getBookFile } from "../../download/getBookFile.shared"
import { Logger } from "../../debug/logger.shared"
import { createArchiveFromZipJs } from "@prose-reader/archive-reader/archives/createArchiveFromZipJs"
import { BlobReader, ZipReader } from "@zip.js/zip.js"

export const FILE_INSPECTION_QUERY_KEY = ["metadataFixer", "fileInspection"]

const resolveBookArchive = (archive: Archive) =>
  resolveArchive(archive, { include: ["metadata", "sources"] })

export type ResolvedBookArchive = Awaited<ReturnType<typeof resolveBookArchive>>

export type FileInspection = {
  fileName: string
  fileSize: number
  resolvedArchive: ResolvedBookArchive
}

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
            const inspection: FileInspection = {
              fileName: file.name,
              fileSize: file.size,
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
