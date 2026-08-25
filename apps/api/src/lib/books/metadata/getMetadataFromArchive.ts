import type { Archive } from "@oboku/archive-metadata/node"
import type { FileMetadata } from "@oboku/shared"
import {
  identifierValue,
  mainTitle,
  type ResolvedMetadata,
  resolveArchive,
} from "@prose-reader/archive-reader"
import { Logger } from "@nestjs/common"

const logger = new Logger("getMetadataFromArchive")

const authorNames = (metadata: ResolvedMetadata): string[] | undefined => {
  const names: string[] = []

  for (const contributor of metadata.contributors ?? []) {
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
  const { metadata, unreadableSources } = await resolveArchive(archive, {
    include: ["metadata"],
  })

  const title = mainTitle(metadata)
  const isbn = identifierValue(metadata.identifiers, "ISBN")

  logger.log(
    `Extracted archive metadata (title=${title !== undefined}, isbn=${isbn !== undefined}, cover=${metadata.cover !== undefined})`,
  )

  if (unreadableSources.length > 0) {
    logger.warn(
      `Archive carries metadata sources it cannot parse: ${unreadableSources.join(", ")}`,
    )
  }

  return {
    type: "file",
    contentType,
    title,
    authors: authorNames(metadata),
    publisher: metadata.publication?.edition?.publisher,
    rights: metadata.rights,
    languages: toMutableList(metadata.languages),
    date: metadata.publication?.edition?.date,
    subjects: toMutableList(metadata.subjects),
    coverLink: metadata.cover?.uri,
    pageCount: metadata.numberOfPages,
    isbn,
  }
}
