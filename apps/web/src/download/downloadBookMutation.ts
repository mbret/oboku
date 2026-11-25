import {
  type Mutation,
  matchMutation,
  type QueryClient,
  useMutationState,
} from "@tanstack/react-query"
import type { Signal } from "reactjrx"
import type { BookQueryResult } from "../books/states"

export const downloadBookMutationKey = ["download", "book"] as const

export type DownloadBookInput = Pick<BookQueryResult, "_id" | "links"> & {
  file?: File
}

/**
 * A download in progress is a pending download mutation: its variables hold
 * everything the download flow needs to run it, report its progress, cancel
 * it and settle it.
 */
export type DownloadBookVariables = DownloadBookInput & {
  abortController: AbortController
  progress: Signal<number>
  settlement: PromiseWithResolvers<void>
}

type DownloadBookMutation = Mutation & {
  state: Mutation["state"] & {
    variables: DownloadBookVariables
  }
}

function isPendingDownload(
  mutation: Mutation,
): mutation is DownloadBookMutation {
  return matchMutation(
    { exact: true, mutationKey: downloadBookMutationKey, status: "pending" },
    mutation,
  )
}

function selectPendingDownload(mutation: Mutation) {
  return isPendingDownload(mutation)
    ? { mutationId: mutation.mutationId, variables: mutation.state.variables }
    : undefined
}

/** The downloads in progress, oldest first. */
export const usePendingDownloads = () =>
  useMutationState({
    filters: { predicate: isPendingDownload },
    select: selectPendingDownload,
  }).filter((pendingDownload) => pendingDownload !== undefined)

export const usePendingBookDownload = (bookId: string | null | undefined) =>
  useMutationState({
    filters: {
      predicate: function isPendingDownloadOfBook(mutation) {
        return (
          isPendingDownload(mutation) && mutation.state.variables._id === bookId
        )
      },
    },
    select: selectPendingDownload,
  }).at(-1)?.variables

export const findPendingBookDownload = (
  queryClient: QueryClient,
  bookId: string,
) =>
  queryClient
    .getMutationCache()
    .getAll()
    .filter(isPendingDownload)
    .findLast(function isDownloadOfBook(mutation) {
      return mutation.state.variables._id === bookId
    })?.state.variables
