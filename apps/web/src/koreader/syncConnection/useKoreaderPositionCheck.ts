import {
  type BookDocType,
  type KoreaderSyncPositionDto,
  koreaderSyncConnectionPullPosition,
} from "@oboku/shared"
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import type { DeepReadonly } from "rxdb"
import { firstValueFrom, from, timeout } from "rxjs"
import { useIsAuthenticated } from "../../auth/useIsAuthenticated"
import { incrementalBookMutation } from "../../books/incrementalBookMutation"
import { isDebugEnabled } from "../../debug/isDebugEnabled.shared"
import { useHttpClientApi } from "../../http"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { isKoreaderPositionNewerThanBookmark } from "../isKoreaderPositionNewerThanBookmark"
import {
  isKoreaderSyncConnectionMissingError,
  isKoreaderSyncKeyRefusedError,
} from "./errors"
import { koreaderSyncPositionQueryKey } from "./queryKeys"
import { createKoreaderSyncConnectionQueryOptions } from "./useKoreaderSyncConnection"

const KOREADER_POSITION_CHECK_DEADLINE_MS = 15_000

/**
 * Where the check of a book's KOReader position stands as the book opens.
 * Once `done`, the book can open: `updatedBook` is the book once its
 * bookmark took the server's newer position, missing when the book keeps
 * its own.
 */
export type KoreaderPositionCheck =
  | { status: "checking"; continueAnyway: () => void }
  | { status: "failed"; tryAgain: () => void; continueAnyway: () => void }
  | { status: "refused"; continueAnyway: () => void }
  | { status: "done"; updatedBook?: DeepReadonly<BookDocType> }

type KoreaderBookmarkUpdate = {
  position: KoreaderSyncPositionDto
  koreaderDocument: string
  savedAt: string
}

const applyKoreaderBookmark = ({
  position,
  koreaderDocument,
  savedAt,
}: KoreaderBookmarkUpdate) =>
  function takeKoreaderPositionAsBookmark(old: BookDocType): BookDocType {
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

const takeKoreaderPositionWhenNewer = (
  bookId: string,
  update: KoreaderBookmarkUpdate,
) =>
  firstValueFrom(
    incrementalBookMutation(
      bookId,
      async function writeKoreaderBookmarkWhenNewer(book) {
        const isPositionNewer = isKoreaderPositionNewerThanBookmark({
          book: book.toJSON(),
          position: update.position,
          koreaderDocument: update.koreaderDocument,
        })

        if (!isPositionNewer) return null

        const updatedBook = await book.incrementalModify(
          applyKoreaderBookmark(update),
        )

        return updatedBook.toJSON()
      },
    ),
  )

/**
 * Asks the account's KOReader sync server, as the book opens, where the
 * book's file was left, and takes that position as the book's bookmark when
 * another device left it there more recently, before letting the book open.
 * The book opens without asking offline, in preview, signed out, or once the
 * user continues without the answer.
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

  const positionQueryKey = koreaderSyncPositionQueryKey({
    profileId: activeProfileId,
    bookId,
    document: koreaderDocument,
  })

  const fetchServerPosition = async (document: string, signal: AbortSignal) => {
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

  const pull = useQuery({
    queryKey: positionQueryKey,
    queryFn:
      isPulling && koreaderDocument !== undefined
        ? async function syncKoreaderPositionOfBook({ signal }) {
            const savedAt = new Date().toISOString()
            const position = await firstValueFrom(
              from(fetchServerPosition(koreaderDocument, signal)).pipe(
                timeout(KOREADER_POSITION_CHECK_DEADLINE_MS),
              ),
            )

            if (!position) return null

            return takeKoreaderPositionWhenNewer(bookId, {
              position,
              koreaderDocument,
              savedAt,
            })
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
    void queryClient.cancelQueries({ queryKey: positionQueryKey })
  }

  if (!isPulling) return { status: "done" }

  if (pull.isSuccess) {
    return { status: "done", updatedBook: pull.data ?? undefined }
  }

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
