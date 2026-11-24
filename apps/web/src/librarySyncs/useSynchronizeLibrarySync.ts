import { librarySyncsSync, ObokuErrorCode } from "@oboku/shared"
import { useNetworkState } from "react-use"
import { useMutation$, isDefined } from "reactjrx"
import { from, filter, switchMap, catchError, map, of } from "rxjs"
import { fromCreateDialog } from "../common/dialogs/fromCreateDialog"
import { createOfflineDialogOptions } from "../common/dialogs/presets"
import { useHttpClientApi } from "../http"
import { usePluginSynchronize } from "../integrations/plugins/usePluginSynchronize"
import { useDatabase } from "../rxdb"
import { useLibrarySyncIncrementalPatch } from "./useLibrarySyncIncrementalPatch"
import { Logger } from "../debug/logger.shared"
import { isCancelError } from "../errors/errors.shared"

export const useSynchronizeLibrarySync = () => {
  const httpClientApi = useHttpClientApi()
  const { db: database } = useDatabase()
  const { mutateAsync: atomicUpdateLibrarySync } =
    useLibrarySyncIncrementalPatch()
  const synchronizeLibrarySync = usePluginSynchronize()
  const network = useNetworkState()

  return useMutation$({
    mutationFn: (_id: string) => {
      if (!network.online) {
        return fromCreateDialog(createOfflineDialogOptions())
      }

      if (!database) {
        throw new Error("No database")
      }

      const datasource$ = from(
        database.datasource.findOne({ selector: { _id } }).exec(),
      )

      return datasource$.pipe(
        filter(isDefined),
        switchMap((librarySync) => from(synchronizeLibrarySync(librarySync))),
        switchMap((data) => {
          return from(
            atomicUpdateLibrarySync({
              id: _id,
              patch: {
                syncStatus: "fetching",
                lastSyncErrorCode: null,
              },
            }),
          ).pipe(
            switchMap(() =>
              from(
                librarySyncsSync({
                  client: httpClientApi.sdkClient,
                  body: {
                    dataSourceId: _id,
                    providerCredentials: data.providerCredentials,
                  },
                }),
              ),
            ),
            catchError((e) => {
              return from(
                atomicUpdateLibrarySync({
                  id: _id,
                  patch: {
                    syncStatus: null,
                    lastSyncErrorCode:
                      ObokuErrorCode.ERROR_DATASOURCE_NETWORK_UNREACHABLE,
                  },
                }),
              ).pipe(
                map((_) => {
                  throw e
                }),
              )
            }),
          )
        }),
        catchError((e) => {
          if (isCancelError(e)) return of(null)

          Logger.error(e)

          return of(null)
        }),
      )
    },
  })
}
