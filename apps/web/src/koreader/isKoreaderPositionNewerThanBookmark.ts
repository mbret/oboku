import {
  type BookDocType,
  getBookmark,
  type KoreaderSyncPositionDto,
} from "@oboku/shared"
import type { DeepReadonly } from "rxdb"
import { getOrCreateInstallationId } from "../common/browser"

type BookmarkedBook = Pick<
  DeepReadonly<BookDocType>,
  | "readingStateCurrentBookmarkLocation"
  | "readingStateCurrentBookmarkLocationUpdatedAt"
  | "readingStateCurrentBookmarkProgressPercent"
  | "readingStateCurrentBookmarkKoreaderProgress"
  | "readingStateCurrentBookmarkKoreaderDocument"
>

const isLeftAfterBookmarkMoved = (
  { updatedAt, percentage }: KoreaderSyncPositionDto,
  book: BookmarkedBook,
) => {
  const bookmarkMovedAt = book.readingStateCurrentBookmarkLocationUpdatedAt
  const isBookmarkDated = !!bookmarkMovedAt

  if (!isBookmarkDated) return true

  const isPositionDated = updatedAt !== null

  if (!isPositionDated) {
    return percentage > book.readingStateCurrentBookmarkProgressPercent
  }

  return new Date(updatedAt).getTime() > new Date(bookmarkMovedAt).getTime()
}

/**
 * Whether the position a KOReader sync server keeps for the opened file is
 * where the book was left last: another device left it there after the
 * bookmark last moved. A server that does not date its positions is
 * compared by percentage, as KOReader does.
 */
export const isKoreaderPositionNewerThanBookmark = ({
  book,
  position,
  koreaderDocument,
}: {
  book: BookmarkedBook
  position: KoreaderSyncPositionDto
  /** The KOReader document of the opened file, which `position` is for. */
  koreaderDocument: string
}) => {
  const koreaderBookmark = getBookmark(book)?.koreader
  const isPushedByThisInstallation =
    position.deviceId === getOrCreateInstallationId()
  const isAtBookmark =
    koreaderBookmark?.document === koreaderDocument &&
    koreaderBookmark.progress === position.progress

  if (isPushedByThisInstallation || isAtBookmark) return false

  return isLeftAfterBookmarkMoved(position, book)
}
