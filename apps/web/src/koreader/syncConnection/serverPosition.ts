import {
  type BookDocType,
  getBookmark,
  type KoreaderSyncPositionDto,
  koreaderSyncConnectionPullPosition,
} from "@oboku/shared"
import type { QueryClient } from "@tanstack/react-query"
import type { DeepReadonly } from "rxdb"
import { getOrCreateInstallationId } from "../../common/browser"
import type { HttpApiClientWeb } from "../../http"
import { isKoreaderSyncConnectionMissingError } from "./errors"
import type { KoreaderSyncConnectionQueryOptions } from "./useKoreaderSyncConnection"

/**
 * The position the account's KOReader sync server keeps for `document`.
 * `null` when it keeps none, or when the account no longer has a server, in
 * which case the cached connection is refreshed.
 */
export const pullServerPosition = async ({
  queryClient,
  httpClientApi,
  connectionQueryOptions,
  document,
  signal,
}: {
  queryClient: QueryClient
  httpClientApi: HttpApiClientWeb
  connectionQueryOptions: KoreaderSyncConnectionQueryOptions
  document: string
  signal: AbortSignal
}) => {
  try {
    const { data } = await koreaderSyncConnectionPullPosition({
      client: httpClientApi.sdkClient,
      path: { document },
      signal,
    })

    return data.position
  } catch (error) {
    if (!isKoreaderSyncConnectionMissingError(error)) throw error

    void queryClient.invalidateQueries({
      queryKey: connectionQueryOptions.queryKey,
      refetchType: "all",
    })

    return null
  }
}

export const isKoreaderPositionAtBookmark = ({
  book,
  position,
  koreaderDocument,
}: {
  book: DeepReadonly<BookDocType>
  position: KoreaderSyncPositionDto
  koreaderDocument: string
}) => {
  const koreaderBookmark = getBookmark(book)?.koreader

  return (
    koreaderBookmark?.document === koreaderDocument &&
    koreaderBookmark.progress === position.progress
  )
}

/**
 * Whether the position a KOReader sync server keeps for `koreaderDocument` is
 * where the book was left last: another device left it there after the
 * bookmark last moved. A server that does not date its positions is compared
 * by percentage, as KOReader does.
 */
export const isKoreaderPositionNewerThanBookmark = ({
  book,
  position,
  koreaderDocument,
}: {
  book: DeepReadonly<BookDocType>
  position: KoreaderSyncPositionDto
  koreaderDocument: string
}) => {
  const { deviceId, percentage, updatedAt } = position
  const isPushedByThisInstallation = deviceId === getOrCreateInstallationId()
  const isAtBookmark = isKoreaderPositionAtBookmark({
    book,
    position,
    koreaderDocument,
  })

  if (isPushedByThisInstallation || isAtBookmark) return false

  const bookmarkMovedAt = book.readingStateCurrentBookmarkLocationUpdatedAt
  const isBookmarkDated = !!bookmarkMovedAt

  if (!isBookmarkDated) return true

  const isPositionDated = updatedAt !== null

  if (!isPositionDated) {
    return percentage > book.readingStateCurrentBookmarkProgressPercent
  }

  return new Date(updatedAt).getTime() > new Date(bookmarkMovedAt).getTime()
}
