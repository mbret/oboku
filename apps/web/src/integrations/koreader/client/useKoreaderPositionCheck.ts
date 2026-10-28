import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useQueryOptionsWithAuthentication } from "../../../auth"
import { useIsAuthenticated } from "../../../auth/useIsAuthenticated"
import { useHttpClientApi } from "../../../http"
import { useActiveProfileId } from "../../../profiles/active/activeProfileId"
import { createKoreaderPositionQueryOptions } from "./createKoreaderPositionQueryOptions"
import { isKoreaderSyncKeyRefusedError } from "./errors"
import { createKoreaderSyncConnectionQueryOptions } from "./useKoreaderSyncConnection"

/**
 * Where the check of a book's KOReader position stands as the book opens.
 * It is `starting` until the app knows the account syncs through a KOReader
 * sync server. Once `done`, the book can open at its bookmark, which holds
 * the server's position when the check took it.
 */
export type KoreaderPositionCheck =
  | { status: "starting" }
  | { status: "checking"; continueAnyway: () => void }
  | { status: "failed"; tryAgain: () => void; continueAnyway: () => void }
  | { status: "refused"; continueAnyway: () => void }
  | { status: "done" }

/**
 * Asks the account's KOReader sync server, as the book opens, where the
 * book's file was left, and takes that position as the book's bookmark when
 * another device left it there more recently, before letting the book open.
 * The book opens without asking offline, in preview, signed out, when the app
 * knows of no server for the account, or once the user continues without the
 * answer.
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
  const [isCheckedOnOpening] = useState(
    () => enabled && isAuthenticated && navigator.onLine,
  )
  const { data: connectionResponse } = useQuery(
    useQueryOptionsWithAuthentication({
      ...createKoreaderSyncConnectionQueryOptions({
        httpClientApi,
        profileId: activeProfileId,
      }),
      enabled: isCheckedOnOpening,
      refetchOnMount: false,
      retryOnMount: false,
    }),
  )
  const [hasContinuedAnyway, setHasContinuedAnyway] = useState(false)
  const isPulling = isCheckedOnOpening && !hasContinuedAnyway
  const positionQueryOptions = createKoreaderPositionQueryOptions({
    queryClient,
    httpClientApi,
    profileId: activeProfileId,
    bookId,
    koreaderDocument,
    isPulling,
  })
  const pull = useQuery(positionQueryOptions)

  const continueAnyway = function continueWithoutKoreaderPosition() {
    setHasContinuedAnyway(true)
    void queryClient.cancelQueries({ queryKey: positionQueryOptions.queryKey })
  }

  const mayBookOpen = !isPulling || pull.isSuccess

  if (mayBookOpen) return { status: "done" }

  const hasFailed = pull.isError && !pull.isFetching

  if (!hasFailed) {
    const hasKnownServer = !!connectionResponse?.connection

    return hasKnownServer
      ? { status: "checking", continueAnyway }
      : { status: "starting" }
  }

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
