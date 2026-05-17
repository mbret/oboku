import {
  type ArchiveSource,
  readArchiveMetadata,
} from "@oboku/archive-metadata"
import type { FileMetadata } from "@oboku/shared"
import { Logger } from "@nestjs/common"

const logger = new Logger("getMetadataFromArchive")

export const getMetadataFromArchive = async (
  archive: ArchiveSource,
  contentType: string,
): Promise<FileMetadata> => {
  const metadata = await readArchiveMetadata(archive)
  const opf = metadata.opf
  const comicInfo = metadata.comicInfo

  logger.log(
    `Extracted archive metadata (hasOpf=${metadata.hasOpf}, hasComicInfo=${metadata.hasComicInfo})`,
  )

  return {
    type: "file",
    contentType,
    title: opf?.title ?? comicInfo?.title,
    authors: opf?.authors ?? comicInfo?.authors,
    publisher: opf?.publisher ?? comicInfo?.publisher,
    rights: opf?.rights ?? comicInfo?.rights,
    languages: opf?.languages ?? comicInfo?.languages,
    date: opf?.date ?? comicInfo?.date,
    subjects: opf?.subjects ?? comicInfo?.subjects,
    coverLink: metadata.coverHref,
    pageCount: metadata.pageCount,
    isbn: comicInfo?.isbn ?? opf?.isbn,
  }
}
