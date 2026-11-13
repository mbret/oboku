import path from "node:path"
import {
  type BookDocType,
  directives,
  getMetadataFromBook,
  isBookProtected,
  type LinkDocType,
} from "@oboku/shared"
import { extension } from "mime-types"
import { BOOK_TITLE_FORMAT } from "../features/metadata/bookTitleFormat.js"

/** The provider whose books the catalogs serve, through the owner's Google connection. */
export const SERVED_LINK_TYPE = "DRIVE" satisfies LinkDocType["type"]

const UNKNOWN_CONTENT_TYPE = "application/octet-stream"

/**
 * Whether the catalogs serve the book: its first link, the one the app reads
 * it from, is a Google Drive file, and the library does not hide it.
 */
export const isServedBook = ({
  book,
  firstLinkType,
  protectedTagIds,
}: {
  book: Readonly<Pick<BookDocType, "isNotInterested">> & {
    readonly tags: ReadonlyArray<string>
  }
  firstLinkType: LinkDocType["type"] | undefined
  protectedTagIds: ReadonlyArray<string>
}) =>
  firstLinkType === SERVED_LINK_TYPE &&
  !book.isNotInterested &&
  !isBookProtected(protectedTagIds, book)

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
      .trim() || book._id
  const knownContentType = metadata.contentType || undefined
  const typeExtension = knownContentType && extension(knownContentType)
  const hasExtension = path.extname(baseName) !== ""
  const name =
    hasExtension || !typeExtension ? baseName : `${baseName}.${typeExtension}`

  return { name, contentType: knownContentType ?? UNKNOWN_CONTENT_TYPE }
}
