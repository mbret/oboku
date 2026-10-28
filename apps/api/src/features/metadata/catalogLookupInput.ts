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

const titleFromLinkName = (linkName: string) =>
  path.parse(directives.removeDirectiveFromString(linkName)).name.trim()

/**
 * Identifiers rank `user > directive > file`, and only the highest-ranked
 * ISBN or Google Books volume id is sent: Google looks a volume id up before
 * an ISBN, and an ISBN that contradicts that volume scores its match 0.
 * Between the two directives the volume id wins, as it names one exact
 * record.
 */
export const catalogLookupInput = ({
  fileMetadata,
  linkName,
  userIsbn,
  directiveIsbn,
  directiveGoogleVolumeId,
}: {
  fileMetadata: FileMetadata | undefined
  linkName: string | undefined
  userIsbn: string | undefined
  directiveIsbn: string | undefined
  directiveGoogleVolumeId: string | undefined
}): FetchMetadataInput => {
  const givenIdentifier: MetadataIdentifier | undefined =
    userIsbn !== undefined
      ? { value: userIsbn, scheme: "ISBN" }
      : directiveGoogleVolumeId !== undefined
        ? { value: directiveGoogleVolumeId, scheme: "GoogleBooks" }
        : directiveIsbn !== undefined
          ? { value: directiveIsbn, scheme: "ISBN" }
          : undefined
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
      const namesTheEdition =
        isIsbnBearingScheme(identifier.scheme) ||
        isGoogleBooksIdentifier(identifier)

      return givenIdentifier === undefined || !namesTheEdition
    },
  )
  const identifiers = [
    ...(givenIdentifier ? [givenIdentifier] : []),
    ...keptFileIdentifiers,
  ]

  return {
    ...fileEvidence,
    ...(title ? { title } : {}),
    ...(identifiers.length > 0 ? { identifiers } : {}),
  }
}
