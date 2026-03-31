import { catchError, defaultIfEmpty, EMPTY, from, map, switchMap } from "rxjs"
import { usePluginRefreshMetadata } from "../plugins/usePluginRefreshMetadata"
import { useCollectionIncrementalModify } from "./useCollectionIncrementalModify"
import { httpClientApi } from "../http/httpClientApi.web"
import { useWithNetwork } from "../common/network/useWithNetwork"
import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { getCollectionById } from "./dbHelpers"
import { CancelError, OfflineError } from "../errors/errors.shared"
import { useMutation$ } from "reactjrx"
import { useToasts } from "../notifications/useToasts"

export const useRefreshCollectionMetadata = () => {
  const { mutateAsync: updateCollection } = useCollectionIncrementalModify()
  const getRefreshMetadataPluginData = usePluginRefreshMetadata()
  const withNetwork = useWithNetwork()
  const { notifyError } = useToasts()

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
                  linkData: collection.linkData,
                }),
              )

              return pluginData$.pipe(
                switchMap(({ providerCredentials }) => {
                  return from(
                    updateCollection({
                      _id: collectionId,
                      metadataUpdateStatus: "fetching",
                      lastMetadataStartedAt: new Date().toISOString(),
                    }),
                  ).pipe(
                    switchMap(() =>
                      from(
                        httpClientApi.refreshCollectionMetadata({
                          collectionId,
                          providerCredentials,
                        }),
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
          if (e instanceof CancelError || e instanceof OfflineError)
            return EMPTY

          notifyError(e)

          throw e
        }),
        defaultIfEmpty(null),
      ),
  })
}
