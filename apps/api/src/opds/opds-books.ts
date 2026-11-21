import {
  type BookDocType,
  type CollectionDocType,
  compareDesc,
  computeCollectionMetadata,
  directives,
  getMetadataFromBook,
  hasReaderAcceptedExtension,
  isBookProtected,
  type LinkDocType,
  type LinkDocTypeForProvider,
  OPDS_SERVED_CONNECTOR_TYPES,
  type OpdsServedConnectorType,
  sortByTitleComparator,
} from "@oboku/shared"
import { extension } from "mime-types"
import { BOOK_TITLE_FORMAT } from "../features/metadata/bookTitleFormat.js"

/** The owner's connections the catalogs check. */
export type ServedConnections = {
  isGoogleConnected: boolean
  /** The connectors the owner connected and has not changed since. */
  connectedConnectorIds: ReadonlySet<string>
}

type ServedConnectorLink = Extract<
  LinkDocType,
  { type: OpdsServedConnectorType }
>

export type ServedLink =
  | LinkDocTypeForProvider<"DRIVE">
  | (ServedConnectorLink & { data: { connectorId: string } })

const isServedConnectorLink = (
  link: LinkDocType,
): link is ServedConnectorLink =>
  OPDS_SERVED_CONNECTOR_TYPES.some((type) => type === link.type)

/**
 * Whether the catalogs serve a link's file: the connection it needs is
 * usable. Links do not record their Google account yet (#996): every Drive
 * link needs the owner's one Google connection. A connector's link needs the
 * connection of the connector it names.
 */
export const isLinkServed = (
  link: LinkDocType,
  connections: ServedConnections,
): link is ServedLink => {
  if (link.type === "DRIVE") return connections.isGoogleConnected

  if (!isServedConnectorLink(link)) return false

  const { connectorId } = link.data

  return (
    connectorId !== undefined &&
    connections.connectedConnectorIds.has(connectorId)
  )
}

/** E-reader apps decode JPEG; not all of them decode the WebP oboku stores. */
export const SERVED_COVER_TYPE = "image/jpeg"

const UNKNOWN_CONTENT_TYPE = "application/octet-stream"

/** Express keeps only what follows the last of them in a file name it sends. */
const PATH_SEPARATORS = /[/\\]/g

export const CATALOG_PAGE_SIZE = 50

const UNTITLED_SHELF_TITLE = "Untitled shelf"

/**
 * The items of a 1-based page of a catalog's list, and where the page stands
 * in it. None past the last page; the first page always exists, empty or not.
 */
export const toCatalogPage = <TItem>(
  items: ReadonlyArray<TItem>,
  pageNumber: number,
) => {
  const firstIndex = (pageNumber - 1) * CATALOG_PAGE_SIZE
  const isPastLastPage = pageNumber > 1 && firstIndex >= items.length

  return isPastLastPage
    ? undefined
    : {
        items: items.slice(firstIndex, firstIndex + CATALOG_PAGE_SIZE),
        page: {
          number: pageNumber,
          size: CATALOG_PAGE_SIZE,
          total: items.length,
        },
      }
}

/**
 * The app's alphabetical order, for shelves and a shelf's books: natural, so
 * "Vol 2" comes before "Vol 10", then by id for equal titles.
 */
export const compareByTitle = (
  a: { id: string; title: string },
  b: { id: string; title: string },
) => sortByTitleComparator(a.title, b.title) || a.id.localeCompare(b.id)

/**
 * The library's order, the books added last first. Books added together, as
 * a sync can, keep one order by id, so pages neither repeat nor skip them.
 */
export const compareNewestFirst = (
  a: Pick<BookDocType, "_id" | "createdAt">,
  b: Pick<BookDocType, "_id" | "createdAt">,
) => compareDesc(a.createdAt, b.createdAt) || a._id.localeCompare(b._id)

/**
 * Whether the library shows the book: no protected tag hides it, and the
 * user did not mark it not interested. The catalogs serve the shown books
 * whose first link, the one the app reads them from, passes `isLinkServed`.
 */
export const isBookShown = ({
  book,
  protectedTagIds,
}: {
  book: Readonly<Pick<BookDocType, "isNotInterested">> & {
    readonly tags: ReadonlyArray<string>
  }
  protectedTagIds: ReadonlyArray<string>
}) => !book.isNotInterested && !isBookProtected(protectedTagIds, book)

/**
 * The served books of a shelf, in its order, none when the catalog does not
 * list the shelf: the app hides a shelf holding a book under a protected tag,
 * and a shelf the catalog serves no book of would be empty.
 */
export const toServedShelfBookIds = ({
  shelfBookIds,
  servedBookIds,
  protectedBookIds,
}: {
  shelfBookIds: ReadonlyArray<string>
  servedBookIds: ReadonlySet<string>
  protectedBookIds: ReadonlySet<string>
}) => {
  const isShelfProtected = shelfBookIds.some((id) => protectedBookIds.has(id))
  const servedShelfBookIds = [...new Set(shelfBookIds)].filter((id) =>
    servedBookIds.has(id),
  )

  return isShelfProtected ? [] : servedShelfBookIds
}

/** A shelf's name as the app shows it by default, without oboku's directives. */
export const toShelfTitle = (collection: Pick<CollectionDocType, "metadata">) =>
  directives
    .removeDirectiveFromString(
      computeCollectionMetadata(collection.metadata ?? []).title ?? "",
    )
    .trim() || UNTITLED_SHELF_TITLE

/** The title a reading app shows for a book: the app's, else its file's name. */
export const toServedTitle = (
  book: Pick<BookDocType, "_id" | "metadata" | "metadataSourcePriority">,
) =>
  String(getMetadataFromBook(book, BOOK_TITLE_FORMAT).title ?? "") ||
  toServedFile(book).name

/**
 * The name and media type a reading app saves the book's file under: the
 * file's name on its provider without oboku's directives, else the book's
 * title, else its id, given the extension of a known media type when it has
 * none.
 */
export const toServedFile = (
  book: Pick<BookDocType, "_id" | "metadata" | "metadataSourcePriority">,
) => {
  const metadata = getMetadataFromBook(book, BOOK_TITLE_FORMAT)
  const providerFileName = book.metadata?.find(
    (entry) => entry.type === "link",
  )?.title
  const baseName =
    directives
      .removeDirectiveFromString(String(providerFileName ?? metadata.title))
      .replaceAll(PATH_SEPARATORS, "-")
      .trim() || book._id
  const knownContentType = metadata.contentType || undefined
  const typeExtension = knownContentType && extension(knownContentType)
  const hasBookExtension = hasReaderAcceptedExtension(baseName)
  const name =
    hasBookExtension || !typeExtension
      ? baseName
      : `${baseName}.${typeExtension}`

  return { name, contentType: knownContentType ?? UNKNOWN_CONTENT_TYPE }
}
