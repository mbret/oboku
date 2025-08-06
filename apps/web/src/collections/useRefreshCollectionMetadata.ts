import { catchError, defaultIfEmpty, EMPTY, from, map, switchMap } from "rxjs"
import { usePluginRefreshMetadata } from "../plugins/usePluginRefreshMetadata"
import { useSyncReplicate } from "../rxdb/replication/useSyncReplicate"
import { useUpdateCollection } from "./useUpdateCollection"
import { httpClientApi } from "../http/httpClientApi.web"
import { useWithNetwork } from "../common/network/useWithNetwork"
import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { getCollectionById } from "./dbHelpers"
import {
  CancelError,
  isPluginError,
  OfflineError,
} from "../errors/errors.shared"
import { useMutation$ } from "reactjrx"
import { useNotifications } from "../notifications/useNofitications"

export const useRefreshCollectionMetadata = () => {
  const { mutateAsync: updateCollection } = useUpdateCollection()
  const { mutateAsync: sync } = useSyncReplicate()
  const getRefreshMetadataPluginData = usePluginRefreshMetadata()
  const withNetwork = useWithNetwork()
  const { notifyError } = useNotifications()

  return useMutation$({
    mutationFn: (collectionId: string) =>
      getLatestDatabase().pipe(
        withNetwork,
        switchMap((db) => {
          const collection$ = getCollectionById(db, collectionId)

          return collection$.pipe(
            switchMap((collection) => {
              if (!collection) throw new Error("Invalid collection id")

              const pluginData$ = from(
                getRefreshMetadataPluginData({
                  linkType: collection.linkType ?? "file",
                  linkData: collection.linkData ?? {},
                  linkResourceId: collection.linkResourceId,
                }),
              )

              return pluginData$.pipe(
                switchMap(({ data: pluginMetadata }) => {
                  return from(
                    updateCollection({
                      _id: collectionId,
                      metadataUpdateStatus: "fetching",
                      lastMetadataStartedAt: new Date().toISOString(),
                    }),
                  ).pipe(
                    switchMap(() => from(sync([db.obokucollection]))),
                    switchMap(() =>
                      from(
                        httpClientApi.refreshCollectionMetadata(
                          collectionId,
                          pluginMetadata,
                        ),
                      ),
                    ),
                    catchError((error) => {
                      return from(
                        updateCollection({
                          _id: collectionId,
                          metadataUpdateStatus: "idle",
                        }),
                      ).pipe(
                        map(() => {
                          throw error
                        }),
                      )
                    }),
                  )
                }),
              )
            }),
          )
        }),
        catchError((e) => {
          if (
            e instanceof CancelError ||
            (isPluginError(e) && e.code === "cancelled") ||
            e instanceof OfflineError
          )
            return EMPTY

          notifyError(e)

          throw e
        }),
        defaultIfEmpty(null),
      ),
  })
}
