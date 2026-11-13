import type { BookDocType } from "../db/books"
import * as directives from "../directives"
import {
  type DeepReadonly,
  getBookMetadataFields,
  type ReadonlyBookMetadataFields,
} from "./fields"
import {
  type BookMetadata,
  type BookMetadataSource,
  type CatalogMetadata,
  getBookMetadataSource,
  getOrderedBookMetadataSources,
} from "./index"

/** What the app shows of a book: its metadata entries merged by priority. */
export type BookDisplayMetadata = ReadonlyBookMetadataFields & {
  readonly language?: string | undefined
}

/** How the consuming app words what the merge adds to a title. */
export type BookTitleFormat = {
  /**
   * A catalog volume's title, given the volume's position in its series, when
   * the catalog's title leaves the position out.
   */
  formatVolumeTitle: (title: string | number, position: number) => string
}

/**
 * One input of the merge: an entry of the book, or the directives parsed
 * from its link's filename, which rank just below the user.
 */
type MergeLayer = {
  source: BookMetadataSource | "directive"
  fields: ReadonlyBookMetadataFields
}

/**
 * Google Books leaves a series volume's number out of its title and states
 * it as the volume's position in the series, which would show every volume
 * of a series under one title.
 */
const getCatalogTitle = (
  entry: DeepReadonly<CatalogMetadata>,
  title: ReadonlyBookMetadataFields["title"],
  { formatVolumeTitle }: BookTitleFormat,
) => {
  const position = entry.metadata.belongsTo?.series?.[0]?.position
  const isPositionInTitle = title
    ?.toString()
    .match(/\d+(?:\.\d+)?/g)
    ?.some((numberInTitle) => Number(numberInTitle) === position)

  return title !== undefined && position !== undefined && !isPositionInTitle
    ? formatVolumeTitle(title, position)
    : title
}

/**
 * {@link getBookMetadataFields}, with a catalog volume's number added to its
 * title.
 */
export const getBookMetadataEntryFields = (
  entry: DeepReadonly<BookMetadata>,
  format: BookTitleFormat,
): ReadonlyBookMetadataFields => {
  const fields = getBookMetadataFields(entry)

  return entry.type === "catalog"
    ? { ...fields, title: getCatalogTitle(entry, fields.title, format) }
    : fields
}

const withoutUndefinedFields = (
  fields: ReadonlyBookMetadataFields,
): ReadonlyBookMetadataFields =>
  // `Object.fromEntries` types every key as `string`; the entries are
  // `fields`' own, minus those whose value is `undefined`.
  Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  ) as ReadonlyBookMetadataFields

/**
 * The book's display metadata: its entries merged from the lowest priority
 * source to the highest, the user's edits winning. A field a source does
 * not state leaves the lower one's value, authors add up, and the title
 * loses its directives.
 */
export const getMetadataFromBook = (
  book:
    | DeepReadonly<Pick<BookDocType, "metadata" | "metadataSourcePriority">>
    | null
    | undefined,
  format: BookTitleFormat,
): BookDisplayMetadata => {
  const list = book?.metadata ?? []

  const linkEntry = list.find((item) => item.type === "link")
  const linkDirectives = linkEntry?.title
    ? directives.extractDirectivesFromName(linkEntry.title.toString())
    : undefined
  const directiveLayer: MergeLayer | undefined =
    linkDirectives?.isbn !== undefined ||
    linkDirectives?.googleVolumeId !== undefined
      ? {
          source: "directive",
          fields: {
            isbn: linkDirectives?.isbn,
            googleVolumeId: linkDirectives?.googleVolumeId,
          },
        }
      : undefined

  const priorityLowestFirst: MergeLayer["source"][] = [
    ...getOrderedBookMetadataSources(book?.metadataSourcePriority)
      .filter((source) => source !== "user")
      .toReversed(),
    "directive",
    "user",
  ]

  const orderedLayers = [
    ...list.map(
      (entry): MergeLayer => ({
        source: getBookMetadataSource(entry),
        fields: getBookMetadataEntryFields(entry, format),
      }),
    ),
    ...(directiveLayer ? [directiveLayer] : []),
  ].toSorted(
    (a, b) =>
      priorityLowestFirst.indexOf(a.source) -
      priorityLowestFirst.indexOf(b.source),
  )

  const reducedMetadata = orderedLayers.reduce<BookDisplayMetadata>(
    function mergeLayer(acc, { fields: item }) {
      const mergedValue = { ...acc, ...withoutUndefinedFields(item) }
      const date = Object.values(item.date ?? {}).length ? item.date : acc.date
      const subjects = item.subjects?.length ? item.subjects : acc.subjects

      return {
        ...mergedValue,
        date,
        subjects,
        authors: [...(acc.authors ?? []), ...(item.authors ?? [])],
        language: (mergedValue.languages ?? [])[0],
      }
    },
    {},
  )

  return {
    ...reducedMetadata,
    title: directives.removeDirectiveFromString(
      reducedMetadata.title?.toString() ?? "",
    ),
  }
}
