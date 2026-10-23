import path from "node:path"
import { directives, type FileMetadata } from "@oboku/shared"
import {
  identifierValue,
  isIsbnBearingScheme,
  type MetadataIdentifier,
} from "@prose-reader/archive-reader"
import {
  type FetchMetadataInput,
  metadataInputFromResolvedArchive,
} from "@prose-reader/metadata-fetcher"

const isGoogleBooksIdentifier = (identifier: MetadataIdentifier) =>
  identifierValue([identifier], "GoogleBooks") !== undefined

/** Some plugins name a link after its file, extension and directives included. */
const titleFromLinkName = (linkName: string) =>
  path.parse(directives.removeDirectiveFromString(linkName)).name.trim()

/**
 * What the catalogs are asked about a book: what its file states, the link's
 * name when the file has no title, and identifiers by `user > directive >
 * file`. An ISBN given by the user or a directive also replaces the file's
 * Google Books ids: Google looks a volume id up before an ISBN, and an ISBN
 * contradicting that volume would score its match 0.
 */
export const catalogLookupInput = ({
  fileMetadata,
  linkName,
  isbn,
  googleVolumeId,
}: {
  fileMetadata: FileMetadata | undefined
  linkName: string | undefined
  /** From the user's metadata, else from a directive. */
  isbn: string | undefined
  /** From a directive. */
  googleVolumeId: string | undefined
}): FetchMetadataInput => {
  const fromFile: FetchMetadataInput = fileMetadata
    ? metadataInputFromResolvedArchive(fileMetadata)
    : {}
  const {
    title: fileTitle,
    identifiers: fileIdentifiers,
    ...fileEvidence
  } = fromFile
  const title =
    fileTitle ?? (linkName ? titleFromLinkName(linkName) : undefined)
  const keptFileIdentifiers = (fileIdentifiers ?? []).filter(
    function isNotOverridden(identifier) {
      const isOverriddenByIsbn =
        isbn !== undefined &&
        (isIsbnBearingScheme(identifier.scheme) ||
          isGoogleBooksIdentifier(identifier))
      const isOverriddenByGoogleVolumeId =
        googleVolumeId !== undefined && isGoogleBooksIdentifier(identifier)

      return !isOverriddenByIsbn && !isOverriddenByGoogleVolumeId
    },
  )
  const identifiers: MetadataIdentifier[] = [
    ...(isbn !== undefined ? [{ value: isbn, scheme: "ISBN" }] : []),
    ...(googleVolumeId !== undefined
      ? [{ value: googleVolumeId, scheme: "GoogleBooks" }]
      : []),
    ...keptFileIdentifiers,
  ]

  return {
    ...fileEvidence,
    ...(title ? { title } : {}),
    ...(identifiers.length > 0 ? { identifiers } : {}),
  }
}
