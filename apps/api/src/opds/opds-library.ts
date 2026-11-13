import {
  type BookDocType,
  directives,
  getMetadataFromBook,
  getUrlExtension,
  isBookProtected,
  type LinkDocType,
  READER_ACCEPTED_EXTENSIONS,
} from "@oboku/shared"
import { extension } from "mime-types"
import { BOOK_TITLE_FORMAT } from "../features/metadata/bookTitleFormat.js"

/** The provider whose books the catalogs serve, through the owner's Google connection. */
export const SERVED_LINK_TYPE = "DRIVE" satisfies LinkDocType["type"]

const UNKNOWN_CONTENT_TYPE = "application/octet-stream"

/** Express keeps only what follows the last of them in a file name it sends. */
const PATH_SEPARATORS = /[/\\]/g

/**
 * Whether the library shows the book: no protected tag hides it, and the
 * user did not mark it not interested. The catalogs serve the shown books
 * whose first link, the one the app reads them from, is a Google Drive file.
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
