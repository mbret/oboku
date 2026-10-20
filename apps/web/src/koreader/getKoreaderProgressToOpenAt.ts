import type { BookDocType, KoreaderSyncPositionDto } from "@oboku/shared"
import type { DeepReadonly } from "rxdb"
import { getOrCreateInstallationId } from "../common/browser"

type OpenedBook = Pick<
  DeepReadonly<BookDocType>,
  | "readingStateCurrentBookmarkLocationUpdatedAt"
  | "readingStateCurrentBookmarkProgressPercent"
  | "readingStateCurrentBookmarkKoreaderProgress"
>

const isNewerThanBookmark = (
  { updatedAt, percentage }: KoreaderSyncPositionDto,
  book: OpenedBook,
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
 * The KOReader `progress` to open the book at instead of its bookmark: the
 * position the sync server keeps for the opened file, when another device
 * left it after the bookmark last moved. A server that does not date its
 * positions is compared by percentage, as KOReader does. `undefined` when
 * the book opens at its bookmark.
 */
export const getKoreaderProgressToOpenAt = ({
  book,
  serverPosition,
}: {
  book: OpenedBook
  /** `undefined` when the server keeps none, or the book opens without asking. */
  serverPosition: KoreaderSyncPositionDto | undefined
}) => {
  if (!serverPosition) return undefined

  const isPushedByThisInstallation =
    serverPosition.deviceId === getOrCreateInstallationId()
  const isAtBookmark =
    serverPosition.progress === book.readingStateCurrentBookmarkKoreaderProgress

  if (isPushedByThisInstallation || isAtBookmark) return undefined

  return isNewerThanBookmark(serverPosition, book)
    ? serverPosition.progress
    : undefined
}
