import {
  type DefaultError,
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import {
  type BookDocType,
  getBookmark,
  type KoreaderSyncConnectionPushPositionData,
  koreaderSyncConnectionPushPosition,
} from "@oboku/shared"
import { useRef } from "react"
import type { DeepReadonly } from "rxdb"
import { getOrCreateInstallationId } from "../../common/browser"
import { useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import {
  isKoreaderSyncConnectionMissingError,
  isKoreaderSyncKeyRefusedError,
} from "./errors"
import {
  isKoreaderPositionAtBookmark,
  isKoreaderPositionNewerThanBookmark,
  pullServerPosition,
} from "./serverPosition"
import { createKoreaderSyncConnectionQueryOptions } from "./useKoreaderSyncConnection"

type KoreaderPositionPush = {
  book: DeepReadonly<BookDocType>
  signal: AbortSignal
}

type KoreaderPosition = Omit<
  KoreaderSyncConnectionPushPositionData["body"],
  "deviceId"
>

/** `undefined` when KOReader cannot open the bookmark's place. */
const toKoreaderPosition = (
  book: DeepReadonly<BookDocType>,
): KoreaderPosition | undefined => {
  const koreaderBookmark = getBookmark(book)?.koreader

  if (!koreaderBookmark) return undefined

  return {
    ...koreaderBookmark,
    percentage: book.readingStateCurrentBookmarkProgressPercent,
  }
}

/**
 * Pushes the KOReader position of a book's bookmark to the account's KOReader
 * sync server, unless the server already holds it or a position newer than the
 * bookmark. Does nothing when KOReader cannot open the bookmark's place, or
 * when the account has no server. A push refused because the connection is
 * gone refreshes the cached connection. Once the server refuses the key,
 * pushes stop until the account connects again, since each would be refused
 * the same way.
 */
export const usePushKoreaderPosition = (
  options?: Pick<
    UseMutationOptions<void, DefaultError, KoreaderPositionPush>,
    "meta"
  >,
) => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()
  // TODO: once the API reports a refused key on the connection, read it from
  // the connection query instead of remembering it here.
  const refusedKeyConnectedAtRef = useRef<string | undefined>(undefined)
  const connectionQueryOptions = createKoreaderSyncConnectionQueryOptions({
    httpClientApi,
    profileId: activeProfileId,
  })

  return useMutation({
    ...options,
    networkMode: "online",
    // One at a time, in the order they were made: the last position made is
    // the one the server keeps.
    scope: { id: "koreader-sync-push" },
    mutationFn: async function pushKoreaderPositionUnlessServerIsAhead({
      book,
      signal,
    }: KoreaderPositionPush) {
      const position = toKoreaderPosition(book)

      if (!position) return

      const { connection } = await queryClient.ensureQueryData(
        connectionQueryOptions,
      )

      if (!connection) return

      const isKeyRefused =
        connection.connectedAt === refusedKeyConnectedAtRef.current

      if (isKeyRefused) return

      const serverPosition = await pullServerPosition({
        queryClient,
        httpClientApi,
        connectionQueryOptions,
        document: position.document,
        signal,
      })

      if (serverPosition) {
        const comparison = {
          book,
          position: serverPosition,
          koreaderDocument: position.document,
        }
        const isServerUpToDate =
          isKoreaderPositionAtBookmark(comparison) ||
          isKoreaderPositionNewerThanBookmark(comparison)

        if (isServerUpToDate) return
      }

      await koreaderSyncConnectionPushPosition({
        client: httpClientApi.sdkClient,
        body: { ...position, deviceId: getOrCreateInstallationId() },
        signal,
      })
    },
    onError: function noteUnusableKoreaderSyncConnection(error) {
      if (isKoreaderSyncKeyRefusedError(error)) {
        refusedKeyConnectedAtRef.current = queryClient.getQueryData(
          connectionQueryOptions.queryKey,
        )?.connection?.connectedAt
      }

      if (isKoreaderSyncConnectionMissingError(error)) {
        return queryClient.invalidateQueries({
          queryKey: connectionQueryOptions.queryKey,
          refetchType: "all",
        })
      }
    },
  })
}
