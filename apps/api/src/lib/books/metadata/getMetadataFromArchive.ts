import { type Archive, readArchiveMetadata } from "@oboku/archive-metadata"
import type { FileMetadata } from "@oboku/shared"
import type { ResolvedMetadata } from "@prose-reader/archive-reader"
import { Logger } from "@nestjs/common"

const logger = new Logger("getMetadataFromArchive")

const authorNames = (
  metadata: ResolvedMetadata | undefined,
): string[] | undefined => {
  const names: string[] = []

  for (const contributor of metadata?.contributors ?? []) {
    if (contributor.roles.includes("author")) {
      names.push(contributor.name)
    }
  }

  return names.length > 0 ? names : undefined
}

const toMutableList = (
  values: ReadonlyArray<string> | undefined,
): string[] | undefined =>
  values && values.length > 0 ? [...values] : undefined

export const getMetadataFromArchive = async (
  archive: Archive,
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
    authors: authorNames(opf) ?? authorNames(comicInfo),
    publisher: opf?.publisher ?? comicInfo?.publisher,
    rights: opf?.rights ?? comicInfo?.rights,
    languages:
      toMutableList(opf?.languages) ?? toMutableList(comicInfo?.languages),
    date: opf?.published ?? comicInfo?.published,
    subjects:
      toMutableList(opf?.subjects) ?? toMutableList(comicInfo?.subjects),
    coverLink: metadata.coverHref,
    pageCount: metadata.pageCount,
    isbn: comicInfo?.isbn ?? opf?.isbn,
  }
}
