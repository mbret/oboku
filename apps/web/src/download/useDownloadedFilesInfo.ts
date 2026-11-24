import { queryOptions, useQuery } from "@tanstack/react-query"
import { dexieDb } from "../rxdb/dexie"

export const downloadedFilesQueryOptions = queryOptions({
  queryKey: ["download", "files"] as const,
  networkMode: "always",
  queryFn: async function listDownloadedFiles() {
    return dexieDb.downloads.toArray()
  },
})

export const useDownloadedFilesInfo = () =>
  useQuery(downloadedFilesQueryOptions)
