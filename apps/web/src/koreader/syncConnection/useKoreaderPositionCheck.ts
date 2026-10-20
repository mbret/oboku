import {
  type BookKoreaderSyncPosition,
  isShallowEqual,
  type KoreaderSyncPositionDto,
  koreaderSyncConnectionPullPosition,
} from "@oboku/shared"
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { firstValueFrom, from, timeout } from "rxjs"
import { useIsAuthenticated } from "../../auth/useIsAuthenticated"
import { incrementalBookMutation } from "../../books/incrementalBookMutation"
import { isDebugEnabled } from "../../debug/isDebugEnabled.shared"
import { useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import {
  isKoreaderSyncConnectionMissingError,
  isKoreaderSyncKeyRefusedError,
} from "./errors"
import { koreaderSyncPositionQueryKey } from "./queryKeys"
import { createKoreaderSyncConnectionQueryOptions } from "./useKoreaderSyncConnection"

const KOREADER_POSITION_CHECK_DEADLINE_MS = 15_000

/**
 * Where the check of a book's KOReader position stands as the book opens.
 * Once `done`, the book can open: `pulledPosition` is the position the
 * account's server keeps for the book's file, `null` when it keeps none or
 * the account has no server, and missing when the book opens without
 * asking.
 */
export type KoreaderPositionCheck =
  | { status: "checking"; continueAnyway: () => void }
  | { status: "failed"; tryAgain: () => void; continueAnyway: () => void }
  | { status: "refused"; continueAnyway: () => void }
  | { status: "done"; pulledPosition?: BookKoreaderSyncPosition | null }

const toBookKoreaderSyncPosition = (
  document: string,
  {
    progress,
    percentage,
    device,
    deviceId,
    updatedAt,
  }: KoreaderSyncPositionDto,
): BookKoreaderSyncPosition => ({
  document,
  progress,
  percentage,
  device,
  deviceId,
  updatedAt,
})

const saveKoreaderSyncPosition = (
  bookId: string,
  position: BookKoreaderSyncPosition | null,
) =>
  firstValueFrom(
    incrementalBookMutation(
      bookId,
      function writeKoreaderSyncPositionWhenChanged(book) {
        const isPositionSaved = isShallowEqual(
          book.toJSON().readingStateKoreaderSyncPosition ?? null,
          position,
        )

        if (isPositionSaved) return Promise.resolve(book)

        return book.incrementalModify(function applyKoreaderSyncPosition(old) {
          return { ...old, readingStateKoreaderSyncPosition: position }
        })
      },
    ),
  )

/**
 * Asks the account's KOReader sync server, as the book opens, where the
 * book's file was left, and saves the answer on the book before letting it
 * open. The book opens without asking offline, in preview, signed out, or
 * once the user continues without the answer.
 */
export const useKoreaderPositionCheck = ({
  bookId,
  koreaderDocument,
  enabled,
}: {
  bookId: string
  /** The KOReader document of the book's file, `undefined` until the book is loaded. */
  koreaderDocument: string | undefined
  enabled: boolean
}): KoreaderPositionCheck => {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const activeProfileId = useActiveProfileId()
  const isAuthenticated = useIsAuthenticated()
  // TODO: check for everyone once the KOReader progress sync screen leaves
  // debug mode.
  const [isCheckedOnOpening] = useState(
    () => enabled && isDebugEnabled() && isAuthenticated && navigator.onLine,
  )
  const [hasContinuedAnyway, setHasContinuedAnyway] = useState(false)
  const isPulling = isCheckedOnOpening && !hasContinuedAnyway
  const connectionQueryOptions = createKoreaderSyncConnectionQueryOptions({
    httpClientApi,
    profileId: activeProfileId,
  })

  const fetchServerPosition = async (document: string) => {
    const { connection } = await queryClient.ensureQueryData(
      connectionQueryOptions,
    )

    if (!connection) return null

    try {
      const { data } = await koreaderSyncConnectionPullPosition({
        client: httpClientApi.sdkClient,
        path: { document },
      })

      return (
        data.position && toBookKoreaderSyncPosition(document, data.position)
      )
    } catch (error) {
      if (!isKoreaderSyncConnectionMissingError(error)) throw error

      void queryClient.invalidateQueries({
        queryKey: connectionQueryOptions.queryKey,
        refetchType: "all",
      })

      return null
    }
  }

  const pull = useQuery({
    queryKey: koreaderSyncPositionQueryKey({
      profileId: activeProfileId,
      bookId,
      document: koreaderDocument,
    }),
    queryFn:
      isPulling && koreaderDocument !== undefined
        ? async function pullKoreaderPositionOfBook() {
            const position = await firstValueFrom(
              from(fetchServerPosition(koreaderDocument)).pipe(
                timeout(KOREADER_POSITION_CHECK_DEADLINE_MS),
              ),
            )

            await saveKoreaderSyncPosition(bookId, position)

            return position
          }
        : skipToken,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    networkMode: "always",
  })

  const continueAnyway = function continueWithoutKoreaderPosition() {
    setHasContinuedAnyway(true)
  }

  if (!isPulling) return { status: "done" }

  if (pull.isSuccess) return { status: "done", pulledPosition: pull.data }

  const hasFailed = pull.isError && !pull.isFetching

  if (!hasFailed) return { status: "checking", continueAnyway }

  const isPasswordRefused = isKoreaderSyncKeyRefusedError(pull.error)

  if (isPasswordRefused) return { status: "refused", continueAnyway }

  return {
    status: "failed",
    continueAnyway,
    tryAgain: function pullKoreaderPositionAgain() {
      void pull.refetch()
    },
  }
}
