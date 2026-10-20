import type { BookDocType, BookKoreaderSyncPosition } from "@oboku/shared"
import type { DeepReadonly } from "rxdb"
import { getOrCreateInstallationId } from "../common/browser"

type OpenedBook = Pick<
  DeepReadonly<BookDocType>,
  | "readingStateCurrentBookmarkLocationUpdatedAt"
  | "readingStateCurrentBookmarkProgressPercent"
  | "readingStateCurrentBookmarkKoreaderProgress"
  | "readingStateKoreaderSyncPosition"
>

const isNewerThanBookmark = (
  position: DeepReadonly<BookKoreaderSyncPosition>,
  book: OpenedBook,
) => {
  const bookmarkMovedAt = book.readingStateCurrentBookmarkLocationUpdatedAt
  const isBookmarkDated = !!bookmarkMovedAt

  if (!isBookmarkDated) return true

  const isPositionDated = position.updatedAt !== null

  if (!isPositionDated) {
    return position.percentage > book.readingStateCurrentBookmarkProgressPercent
  }

  return (
    new Date(position.updatedAt).getTime() > new Date(bookmarkMovedAt).getTime()
  )
}

/**
 * The KOReader `progress` to open the book at instead of its bookmark: the
 * position the sync server keeps, when another device left it in this file
 * after the bookmark last moved. A server that does not date its positions
 * is compared by percentage, as KOReader does. `undefined` when the book
 * opens at its bookmark.
 */
export const getKoreaderProgressToOpenAt = ({
  book,
  pulledPosition,
  koreaderDocument,
}: {
  book: OpenedBook
  /** The position just asked for; the one saved on the book when `undefined`. */
  pulledPosition: BookKoreaderSyncPosition | null | undefined
  /** The KOReader document of the file the book opens, `undefined` when unknown. */
  koreaderDocument: string | undefined
}) => {
  const position =
    pulledPosition === undefined
      ? book.readingStateKoreaderSyncPosition
      : pulledPosition

  if (!position) return undefined

  const isForOpenedFile = position.document === koreaderDocument
  const isPushedByThisInstallation =
    position.deviceId === getOrCreateInstallationId()
  const isAtBookmark =
    position.progress === book.readingStateCurrentBookmarkKoreaderProgress

  if (!isForOpenedFile || isPushedByThisInstallation || isAtBookmark) {
    return undefined
  }

  return isNewerThanBookmark(position, book) ? position.progress : undefined
}
