import type { FileMetadata, LegacyFileMetadata } from "@oboku/shared"
import type {
  ResolvedMetadata,
  ResolvedMetadataIdentifier,
} from "@prose-reader/archive-reader"

const nonEmpty = <TItem>(values: ReadonlyArray<TItem> | undefined) =>
  values?.length ? values : undefined

/**
 * The flat `file` entry in archive-reader's vocabulary. The flat entry kept
 * the edition's publisher and date. An entry older than `coverConfidence`
 * gets `assumed`, which is how cover picking already reads a missing one.
 */
export const fileMetadataFromLegacy = (
  entry: LegacyFileMetadata,
): FileMetadata => {
  const authors = nonEmpty(entry.authors)
  const languages = nonEmpty(entry.languages)
  const subjects = nonEmpty(entry.subjects)
  const identifiers: ResolvedMetadataIdentifier[] = [
    ...(entry.isbn ? [{ value: entry.isbn, scheme: "ISBN" }] : []),
    ...(entry.googleVolumeId
      ? [{ value: entry.googleVolumeId, scheme: "GoogleBooks" }]
      : []),
  ]
  const hasPublication =
    entry.publisher !== undefined || entry.date !== undefined

  const metadata: ResolvedMetadata = {
    ...(entry.title !== undefined && {
      titles: [{ value: String(entry.title) }],
    }),
    ...(authors && {
      contributors: authors.map((name) => ({ name, roles: ["author"] })),
    }),
    ...(hasPublication && {
      publication: {
        edition: {
          ...(entry.publisher !== undefined && { publisher: entry.publisher }),
          ...(entry.date !== undefined && { date: entry.date }),
        },
      },
    }),
    ...(entry.rights !== undefined && { rights: entry.rights }),
    ...(languages && { languages }),
    ...(subjects && { subjects }),
    ...(entry.coverLink !== undefined && {
      cover: {
        uri: entry.coverLink,
        confidence: entry.coverConfidence ?? "assumed",
      },
    }),
    ...(entry.pageCount !== undefined && { numberOfPages: entry.pageCount }),
    ...(identifiers.length > 0 && { identifiers }),
  }

  return {
    type: "file",
    ...(entry.contentType !== undefined && { contentType: entry.contentType }),
    metadata,
  }
}
