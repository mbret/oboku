import {
  type BookDocType,
  getBookmark,
  type KoreaderSyncPositionDto,
  koreaderSyncConnectionPullPosition,
} from "@oboku/shared"
import {
  type QueryClient,
  queryOptions,
  skipToken,
} from "@tanstack/react-query"
import type { DeepReadonly } from "rxdb"
import { firstValueFrom, from, timeout } from "rxjs"
import { incrementalBookMutation } from "../../books/incrementalBookMutation"
import { getOrCreateInstallationId } from "../../common/browser"
import type { HttpApiClientWeb } from "../../http"
import { API_QUERY_KEY_PREFIX } from "../../queries/queryClient"
import { isKoreaderSyncConnectionMissingError } from "./errors"
import { createKoreaderSyncConnectionQueryOptions } from "./useKoreaderSyncConnection"

const KOREADER_POSITION_CHECK_DEADLINE_MS = 15_000

const fetchServerPosition = async ({
  queryClient,
  httpClientApi,
  profileId,
  document,
  signal,
}: {
  queryClient: QueryClient
  httpClientApi: HttpApiClientWeb
  profileId: string | undefined
  document: string
  signal: AbortSignal
}) => {
  const connectionQueryOptions = createKoreaderSyncConnectionQueryOptions({
    httpClientApi,
    profileId,
  })
  const { connection } = await queryClient.ensureQueryData(
    connectionQueryOptions,
  )

  if (!connection) return null

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

/**
 * Whether the position a KOReader sync server keeps for the opened file is
 * where the book was left last: another device left it there after the
 * bookmark last moved. A server that does not date its positions is
 * compared by percentage, as KOReader does.
 */
const isKoreaderPositionNewerThanBookmark = ({
  book,
  position: { deviceId, progress, percentage, updatedAt },
  koreaderDocument,
}: {
  book: DeepReadonly<BookDocType>
  position: KoreaderSyncPositionDto
  koreaderDocument: string
}) => {
  const koreaderBookmark = getBookmark(book)?.koreader
  const isPushedByThisInstallation = deviceId === getOrCreateInstallationId()
  const isAtBookmark =
    koreaderBookmark?.document === koreaderDocument &&
    koreaderBookmark.progress === progress

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

const takeKoreaderPositionWhenNewer = ({
  bookId,
  position,
  koreaderDocument,
  savedAt,
}: {
  bookId: string
  position: KoreaderSyncPositionDto
  koreaderDocument: string
  savedAt: string
}) =>
  firstValueFrom(
    incrementalBookMutation(
      bookId,
      async function writeKoreaderBookmarkWhenNewer(book) {
        const isPositionNewer = isKoreaderPositionNewerThanBookmark({
          book: book.toJSON(),
          position,
          koreaderDocument,
        })

        if (!isPositionNewer) return

        await book.incrementalModify(function takeKoreaderPositionAsBookmark(
          old: BookDocType,
        ): BookDocType {
          return {
            ...old,
            readingStateCurrentBookmarkLocation: null,
            readingStateCurrentBookmarkProgressPercent: position.percentage,
            readingStateCurrentBookmarkKoreaderProgress: position.progress,
            readingStateCurrentBookmarkKoreaderDocument: koreaderDocument,
            readingStateCurrentBookmarkLocationUpdatedAt:
              position.updatedAt ?? savedAt,
          }
        })
      },
    ),
  )

/**
 * The check of a book's KOReader position, as a query: it asks the server
 * for the position of the book's file, and takes it as the bookmark when
 * another device left it there more recently. Resolves with the server's
 * position, `null` when it has none.
 */
export const createKoreaderPositionQueryOptions = ({
  queryClient,
  httpClientApi,
  profileId,
  bookId,
  koreaderDocument,
  isPulling,
}: {
  queryClient: QueryClient
  httpClientApi: HttpApiClientWeb
  profileId: string | undefined
  bookId: string
  koreaderDocument: string | undefined
  isPulling: boolean
}) =>
  queryOptions({
    queryKey: [
      API_QUERY_KEY_PREFIX,
      "koreader-sync-position",
      profileId,
      bookId,
      koreaderDocument,
    ],
    queryFn:
      isPulling && koreaderDocument !== undefined
        ? async function syncKoreaderPositionOfBook({ signal }) {
            const savedAt = new Date().toISOString()
            const position = await firstValueFrom(
              from(
                fetchServerPosition({
                  queryClient,
                  httpClientApi,
                  profileId,
                  document: koreaderDocument,
                  signal,
                }),
              ).pipe(timeout(KOREADER_POSITION_CHECK_DEADLINE_MS)),
            )

            if (position) {
              await takeKoreaderPositionWhenNewer({
                bookId,
                position,
                koreaderDocument,
                savedAt,
              })
            }

            return position
          }
        : skipToken,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    networkMode: "always",
  })
