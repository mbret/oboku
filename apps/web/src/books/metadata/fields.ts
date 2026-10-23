import {
  type BookMetadata,
  type CatalogMetadata,
  type DeepReadonly,
  getBookMetadataFields,
  type ReadonlyBookMetadataFields,
} from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"

/**
 * Google Books leaves a series volume's number out of its title and states
 * it as the volume's position in the series, which would show every volume
 * of a series under one title.
 */
const getCatalogTitle = (
  entry: DeepReadonly<CatalogMetadata>,
  title: ReadonlyBookMetadataFields["title"],
) => {
  const position = entry.metadata.belongsTo?.series?.[0]?.position
  const isPositionInTitle = title
    ?.toString()
    .match(/\d+(?:\.\d+)?/g)
    ?.some((numberInTitle) => Number(numberInTitle) === position)

  return title !== undefined && position !== undefined && !isPositionInTitle
    ? `${title} Vol ${position}`
    : title
}

/** {@link getBookMetadataFields} for an entry of an rxdb book document. */
export const getBookMetadataEntryFields = (
  rxdbEntry: DeepReadonlyObject<BookMetadata>,
): ReadonlyBookMetadataFields => {
  // rxdb's DeepReadonly turns the branded `string & {}` types of
  // prose-reader's metadata into objects. The stored values are the plain
  // JSON strings those types describe.
  const entry = rxdbEntry as unknown as DeepReadonly<BookMetadata>
  const fields = getBookMetadataFields(entry)

  return entry.type === "catalog"
    ? { ...fields, title: getCatalogTitle(entry, fields.title) }
    : fields
}
