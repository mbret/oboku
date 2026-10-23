import {
  type FileMetadata,
  isLegacyFileMetadata,
  type LegacyFileMetadata,
} from "@oboku/shared"
import type {
  ResolvedMetadata,
  ResolvedMetadataIdentifier,
} from "@prose-reader/archive-reader"

/**
 * The flat entry kept the edition's publisher and date. An entry older than
 * `coverConfidence` gets `assumed`, which is how cover picking already reads
 * a missing one.
 */
const fileMetadataFromLegacy = (entry: LegacyFileMetadata): FileMetadata => {
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
    ...(entry.authors?.length
      ? {
          contributors: entry.authors.map((name) => ({
            name,
            roles: ["author"],
          })),
        }
      : {}),
    ...(hasPublication && {
      publication: {
        edition: {
          ...(entry.publisher !== undefined && { publisher: entry.publisher }),
          ...(entry.date !== undefined && { date: entry.date }),
        },
      },
    }),
    ...(entry.rights !== undefined && { rights: entry.rights }),
    ...(entry.languages?.length ? { languages: entry.languages } : {}),
    ...(entry.subjects?.length ? { subjects: entry.subjects } : {}),
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

/** A stored file entry in archive-reader's vocabulary, whatever shape it is in. */
export const toFileMetadata = (
  entry: FileMetadata | LegacyFileMetadata,
): FileMetadata =>
  isLegacyFileMetadata(entry) ? fileMetadataFromLegacy(entry) : entry
