import { liveQuery } from "dexie"
import { queryOptions$, useLiveQuery$ } from "reactjrx"
import { from, type ObservedValueOf } from "rxjs"
import { dexieDb } from "../rxdb/dexie"

/**
 * The downloads stored on the device, again after each change to them,
 * including the changes of other tabs.
 */
const observeStoredDownloads = () =>
  from(
    liveQuery(function listStoredDownloads() {
      return dexieDb.downloads.toArray()
    }),
  )

export type StoredDownload = ObservedValueOf<
  ReturnType<typeof observeStoredDownloads>
>[number]

export const storedDownloadsQueryOptions = queryOptions$({
  queryKey: ["download", "stored"] as const,
  queryFn: observeStoredDownloads,
  networkMode: "always",
  meta: { survivesSessionReset: true, notifyErrors: true },
})

export const selectStoredBookIds = (storedDownloads: StoredDownload[]) =>
  storedDownloads.map(({ id }) => id)

export const findStoredFileSize = (
  storedDownloads: StoredDownload[] | undefined,
  bookId: string | null | undefined,
) => storedDownloads?.find(({ id }) => id === bookId)?.data.size

export function useStoredDownloads<TData = StoredDownload[]>(
  select?: (storedDownloads: StoredDownload[]) => TData,
) {
  return useLiveQuery$({ ...storedDownloadsQueryOptions, select })
}

function hasReadStoredDownloads() {
  return true
}

/**
 * Whether the stored downloads have been read once. It stays true when a
 * later read fails, since the query keeps its data then.
 */
export const useHasReadStoredDownloads = () =>
  useStoredDownloads(hasReadStoredDownloads).data ?? false
