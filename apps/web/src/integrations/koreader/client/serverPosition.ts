import {
  type BookDocType,
  getBookmark,
  type KoreaderSyncPositionDto,
} from "@oboku/shared"
import type { DeepReadonly } from "rxdb"
import { getOrCreateInstallationId } from "../../../common/browser"

/**
 * Where the position a KOReader sync server keeps for `koreaderDocument`
 * stands against the book's bookmark: at its place, newer (another device left
 * it there after the bookmark last moved), or older. A server that does not
 * date its positions is compared by percentage, as KOReader does. A position
 * this installation pushed is never newer.
 */
export const compareKoreaderPositionWithBookmark = ({
  book,
  position: { deviceId, progress, percentage, updatedAt },
  koreaderDocument,
}: {
  book: DeepReadonly<BookDocType>
  position: KoreaderSyncPositionDto
  koreaderDocument: string
}): "atBookmark" | "newer" | "older" => {
  const koreaderBookmark = getBookmark(book)?.koreader
  const isAtBookmark =
    koreaderBookmark?.document === koreaderDocument &&
    koreaderBookmark.progress === progress

  if (isAtBookmark) return "atBookmark"

  const isPushedByThisInstallation = deviceId === getOrCreateInstallationId()

  if (isPushedByThisInstallation) return "older"

  const bookmarkMovedAt = book.readingStateCurrentBookmarkLocationUpdatedAt
  const isBookmarkDated = !!bookmarkMovedAt

  if (!isBookmarkDated) return "newer"

  const isPositionDated = updatedAt !== null
  const isNewer = isPositionDated
    ? new Date(updatedAt).getTime() > new Date(bookmarkMovedAt).getTime()
    : percentage > book.readingStateCurrentBookmarkProgressPercent

  return isNewer ? "newer" : "older"
}
