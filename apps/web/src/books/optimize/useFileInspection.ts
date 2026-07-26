import { skipToken, useQuery } from "@tanstack/react-query"
import type { Archive } from "@oboku/archive-metadata"
import {
  type ResolvedArchive,
  type ResolvedArchiveSourceKind,
  resolveArchive,
} from "@prose-reader/archive-reader"
import { getBookFile } from "../../download/getBookFile.shared"
import { Logger } from "../../debug/logger.shared"
import { createArchiveFromZipJs } from "@prose-reader/archive-reader/archives/createArchiveFromZipJs"
import { BlobReader, ZipReader } from "@zip.js/zip.js"
import {
  listImageEntries,
  measureAverageImageResolution,
  type ImageResolution,
} from "./content/images"

export const FILE_INSPECTION_QUERY_KEY = ["metadataFixer", "fileInspection"]

/**
 * `unreadable` means the container file is there but its XML could not be
 * parsed. It is a state of its own because it decides what saving can do:
 * a container we cannot read is one we cannot patch.
 */
export type ContainerState = "absent" | "readable" | "unreadable"

/**
 * The metadata containers the archive carries, and the single ISBN the book
 * declares through them. Which container the ISBN came from is not surfaced —
 * the user edits a book's ISBN, not a container's.
 */
type ArchiveContainers = {
  opf: ContainerState
  comicInfo: ContainerState
  isbn: string | undefined
}

export type FileInspection = ArchiveContainers & {
  fileName: string
  fileSize: number
  imageCount: number
  imageBytes: number
  averageImageResolution: ImageResolution | undefined
}

const inspectContent = (
  records: ReturnType<typeof listImageEntries>,
): { imageCount: number; imageBytes: number } => ({
  imageCount: records.length,
  imageBytes: records.reduce((total, { size }) => total + size, 0),
})

const containerState = (
  kind: ResolvedArchiveSourceKind,
  {
    sources,
    unreadableSources,
  }: Pick<ResolvedArchive, "sources" | "unreadableSources">,
): ContainerState => {
  if (sources[kind] !== undefined) return "readable"

  return unreadableSources.includes(kind) ? "unreadable" : "absent"
}

const readArchiveContainers = async (
  archive: Archive,
): Promise<ArchiveContainers> => {
  const resolved = await resolveArchive(archive, {
    include: ["metadata", "sources"],
  })

  const containers: ArchiveContainers = {
    opf: containerState("opf", resolved),
    comicInfo: containerState("comicInfo", resolved),
    isbn: resolved.metadata.isbn,
  }

  Logger.info("[metadataFixer] archive containers", containers)

  return containers
}

/**
 * Inspects the locally cached book file in a single pass: file stats, image
 * stats, and embedded metadata.
 *
 * A container that cannot be parsed never fails the inspection — it surfaces
 * as `unreadable` so the metadata tab can tell the user what saving will and
 * will not touch.
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

          const archive = await createArchiveFromZipJs(
            new ZipReader(new BlobReader(file)),
          )

          try {
            const imageRecords = listImageEntries(archive)
            const { imageCount, imageBytes } = inspectContent(imageRecords)
            const averageImageResolution =
              await measureAverageImageResolution(imageRecords)
            const containers = await readArchiveContainers(archive)

            return {
              fileName: file.name,
              fileSize: file.size,
              imageCount,
              imageBytes,
              averageImageResolution,
              ...containers,
            }
          } finally {
            await archive.close()
          }
        }
      : skipToken,
  })
