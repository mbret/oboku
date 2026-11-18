import {
  type BookDocType,
  type CollectionDocType,
  compareDesc,
  computeCollectionMetadata,
  directives,
  getMetadataFromBook,
  getUrlExtension,
  isBookProtected,
  type LinkDocType,
  type LinkDocTypeForProvider,
  READER_ACCEPTED_EXTENSIONS,
  sortByTitleComparator,
} from "@oboku/shared"
import { extension } from "mime-types"
import { BOOK_TITLE_FORMAT } from "../features/metadata/bookTitleFormat.js"

/** The connection a link's file needs: its provider, and the account its data names. */
export type LinkConnection =
  | { provider: "DRIVE"; link: LinkDocTypeForProvider<"DRIVE"> }
  | { provider: "webdav"; connectorId: string; filePath: string }

/**
 * The connection a link's file needs, none for a provider the catalogs
 * cannot reach, or a WebDAV link that names no connector. Links do not
 * record their Google account yet (#996): every Drive link needs the owner's
 * one Google connection.
 */
export const toLinkConnection = (link: LinkDocType): LinkConnection | null => {
  switch (link.type) {
    case "DRIVE":
      return { provider: link.type, link }
    case "webdav": {
      const { connectorId, filePath } = link.data

      return connectorId === undefined
        ? null
        : { provider: link.type, connectorId, filePath }
    }
    default:
      return null
  }
}

/** The owner's connections the catalog's lists check, read once per request. */
export type ServedConnections = {
  isGoogleConnected: boolean
  /** The connectors the owner connected and has not changed since. */
  connectedConnectorIds: ReadonlySet<string>
}

/** Whether the catalogs list a link's file: the connection it needs is usable. */
export const isLinkServed = ({
  link,
  connections,
}: {
  link: LinkDocType
  connections: ServedConnections
}) => {
  const linkConnection = toLinkConnection(link)

  if (linkConnection?.provider === "DRIVE") return connections.isGoogleConnected

  if (linkConnection?.provider === "webdav") {
    return connections.connectedConnectorIds.has(linkConnection.connectorId)
  }

  return false
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
 * whose first link, the one the app reads them from, `isLinkServed`.
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
  const hasBookExtension = READER_ACCEPTED_EXTENSIONS.includes(
    `.${getUrlExtension(baseName).toLowerCase()}`,
  )
  const name =
    hasBookExtension || !typeExtension
      ? baseName
      : `${baseName}.${typeExtension}`

  return { name, contentType: knownContentType ?? UNKNOWN_CONTENT_TYPE }
}
