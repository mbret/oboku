import {
  type BookDocType,
  type KoreaderSyncPositionDto,
  koreaderSyncConnectionPullPosition,
} from "@oboku/shared"
import {
  type QueryClient,
  queryOptions,
  skipToken,
} from "@tanstack/react-query"
import { catchError, firstValueFrom, from, map, of, timeout } from "rxjs"
import { incrementalBookMutation } from "../../books/incrementalBookMutation"
import type { HttpApiClientWeb } from "../../http"
import { API_QUERY_KEY_PREFIX } from "../../queries/queryClient"
import type { BookPatch } from "../../reader/progress/bookProgressPatches"
import { isKoreaderSyncConnectionMissingError } from "./errors"
import { compareKoreaderPositionWithBookmark } from "./serverPosition"
import { createKoreaderSyncConnectionQueryOptions } from "./useKoreaderSyncConnection"

const KOREADER_POSITION_CHECK_DEADLINE_MS = 15_000

type KoreaderSyncConnectionQueryOptions = ReturnType<
  typeof createKoreaderSyncConnectionQueryOptions
>

/**
 * Whether the account syncs through a KOReader sync server, as the app knows
 * it. A lookup still out is waited for, up to the deadline, after which it is
 * cancelled as failed. `false` when the lookup fails or failed before: the
 * book then opens as without a server.
 */
const isSyncingWithKoreaderServer = async ({
  queryClient,
  connectionQueryOptions,
}: {
  queryClient: QueryClient
  connectionQueryOptions: KoreaderSyncConnectionQueryOptions
}) => {
  const knownState = queryClient.getQueryState(connectionQueryOptions.queryKey)

  if (knownState?.data) return !!knownState.data.connection

  const hasLookupFailed = knownState?.status === "error"

  if (hasLookupFailed) return false

  return firstValueFrom(
    from(queryClient.ensureQueryData(connectionQueryOptions)).pipe(
      map(function hasConnection({ connection }) {
        return !!connection
      }),
      timeout({
        first: KOREADER_POSITION_CHECK_DEADLINE_MS,
        with: function giveUpOnLookup() {
          void queryClient.cancelQueries(
            { queryKey: connectionQueryOptions.queryKey },
            { revert: false },
          )

          return of(false)
        },
      }),
      catchError(function openAsWithoutServer() {
        return of(false)
      }),
    ),
  )
}

const pullServerPosition = async ({
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

const createKoreaderPositionPatch = ({
  position,
  koreaderDocument,
}: {
  position: KoreaderSyncPositionDto
  koreaderDocument: string
}): BookPatch =>
  function applyKoreaderPositionWhenNewer(old, savedAt) {
    const isPositionNewer =
      compareKoreaderPositionWithBookmark({
        book: old,
        position,
        koreaderDocument,
      }) === "newer"

    if (!isPositionNewer) return old

    return {
      ...old,
      readingStateCurrentBookmarkLocation: null,
      readingStateCurrentBookmarkProgressPercent: position.percentage,
      readingStateCurrentBookmarkKoreaderProgress: position.progress,
      readingStateCurrentBookmarkKoreaderDocument: koreaderDocument,
      readingStateCurrentBookmarkLocationUpdatedAt:
        position.updatedAt ?? savedAt,
    }
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
        // RxDB writes a new revision even when the modifier returns the book
        // unchanged.
        const isPositionNewer =
          compareKoreaderPositionWithBookmark({
            book: book.toJSON(),
            position,
            koreaderDocument,
          }) === "newer"

        if (!isPositionNewer) return

        const patch = createKoreaderPositionPatch({
          position,
          koreaderDocument,
        })

        await book.incrementalModify(function applyPatchAsOfSave(
          old: BookDocType,
        ) {
          return patch(old, savedAt)
        })
      },
    ),
  )

/**
 * The check of a book's KOReader position, as a query: it asks the account's
 * server for the position of the book's file, and takes it as the bookmark
 * when another device left it there more recently. Resolves with the server's
 * position, `null` when it has none or the app knows of no server.
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
            const connectionQueryOptions =
              createKoreaderSyncConnectionQueryOptions({
                httpClientApi,
                profileId,
              })
            const isSyncing = await isSyncingWithKoreaderServer({
              queryClient,
              connectionQueryOptions,
            })

            if (!isSyncing) return null

            const savedAt = new Date().toISOString()
            const position = await firstValueFrom(
              from(
                pullServerPosition({
                  queryClient,
                  httpClientApi,
                  connectionQueryOptions,
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
