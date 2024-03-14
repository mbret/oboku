import { catchError, from, map, of, switchMap } from "rxjs"
import { usePluginRefreshMetadata } from "../plugins/usePluginRefreshMetadata"
import { useSyncReplicate } from "../rxdb/replication/useSyncReplicate"
import { useUpdateCollection } from "./useUpdateCollection"
import { httpClient } from "../http/httpClient"
import { isPluginError } from "../plugins/plugin-front"
import { useMutation } from "reactjrx"
import { useWithNetwork } from "../network/useWithNetwork"
import { getLatestDatabase } from "../rxdb/useCreateDatabase"
import { OfflineError } from "../errors"
import { getCollectionById } from "./databaseHelpers"

export const useRefreshCollectionMetadata = () => {
  const { mutateAsync: updateCollection } = useUpdateCollection()
  const { mutateAsync: sync } = useSyncReplicate()
  const getRefreshMetadataPluginData = usePluginRefreshMetadata()
  const withNetwork = useWithNetwork()

  return useMutation({
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
                  linkType: collection.linkType ?? ""
                })
              )

              return pluginData$.pipe(
                switchMap(({ data: pluginMetadata }) => {
                  return from(
                    updateCollection({
                      _id: collectionId,
                      metadataUpdateStatus: "fetching",
                      lastMetadataStartedAt: new Date().toISOString()
                    })
                  ).pipe(
                    switchMap(() => from(sync([db.obokucollection]))),
                    switchMap(() =>
                      from(
                        httpClient.refreshCollectionMetadata(
                          collectionId,
                          pluginMetadata
                        )
                      )
                    ),
                    catchError((error) => {
                      return from(
                        updateCollection({
                          _id: collectionId,
                          metadataUpdateStatus: "idle"
                        })
                      ).pipe(
                        map(() => {
                          throw error
                        })
                      )
                    })
                  )
                })
              )
            })
          )
        }),
        catchError((e) => {
          if (
            (isPluginError(e) && e.code === "cancelled") ||
            e instanceof OfflineError
          )
            return of(null)

          throw e
        })
      )
  })
}
