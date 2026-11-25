import type { LibrarySyncDocType } from "@oboku/shared"
import { useNetworkState } from "react-use"
import { useSynchronizeLibrarySync } from "./useSynchronizeLibrarySync"
import { useMutation$ } from "reactjrx"
import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { from, switchMap } from "rxjs"

export const useCreateLibrarySync = () => {
  type Payload = Omit<
    LibrarySyncDocType,
    "_id" | "rx_model" | "_rev" | `rxdbMeta`
  >
  const { mutateAsync: synchronize } = useSynchronizeLibrarySync()
  const network = useNetworkState()

  return useMutation$({
    mutationFn: (
      data: Omit<
        Payload,
        "lastSyncedAt" | "createdAt" | "modifiedAt" | "syncStatus"
      >,
    ) =>
      getLatestDatabase().pipe(
        switchMap((db) => {
          const librarySync$ = from(
            db.datasource.post({
              ...data,
              lastSyncedAt: null,
              createdAt: new Date().toISOString(),
              modifiedAt: null,
              syncStatus: null,
            }),
          )

          return librarySync$
        }),
      ),
    onSuccess: (librarySync) => {
      if (librarySync && network.online) {
        synchronize(librarySync._id)
      }
    },
  })
}
