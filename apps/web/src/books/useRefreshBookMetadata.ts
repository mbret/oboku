import { useNetworkState } from "react-use"
import { from, switchMap, catchError, map, of } from "rxjs"
import { httpClientApi } from "../http/httpClientApi.web"
import { usePluginRefreshMetadata } from "../plugins/usePluginRefreshMetadata"
import { useDatabase } from "../rxdb"
import { useSyncReplicate } from "../rxdb/replication/useSyncReplicate"
import { Logger } from "../debug/logger.shared"
import { createDialog } from "../common/dialogs/createDialog"
import { useIncrementalBookPatch } from "./useIncrementalBookPatch"
import { isPluginError } from "../errors/errors.shared"
import { useNotifications } from "../notifications/useNofitications"

export const useRefreshBookMetadata = () => {
  const { db: database } = useDatabase()
  const { mutateAsync: incrementalPatchBook } = useIncrementalBookPatch()
  const network = useNetworkState()
  const { mutateAsync: sync } = useSyncReplicate()
  const refreshPluginMetadata = usePluginRefreshMetadata()
  const { notifyError } = useNotifications()

  return async (bookId: string) => {
    try {
      if (!network.online) {
        return createDialog({ preset: "OFFLINE", autoStart: true })
      }

      const book = await database?.book
        .findOne({ selector: { _id: bookId } })
        .exec()

      const firstLink = await database?.link
        .findOne({ selector: { _id: book?.links[0] } })
        .exec()

      if (!firstLink) {
        Logger.error(`No link found ${bookId}`)

        return
      }

      const { data: pluginMetadata } = await refreshPluginMetadata({
        linkType: firstLink.type,
        linkData: firstLink.data ?? {},
      })

      if (!database) return

      from(
        incrementalPatchBook({
          doc: bookId,
          patch: {
            metadataUpdateStatus: "fetching",
          },
        }),
      )
        .pipe(
          switchMap(() => from(sync([database.link, database.book]))),
          switchMap(() =>
            from(
              httpClientApi.refreshBookMetadata(bookId, pluginMetadata ?? {}),
            ),
          ),
          catchError((e) =>
            from(
              incrementalPatchBook({
                doc: bookId,
                patch: {
                  metadataUpdateStatus: null,
                  lastMetadataUpdateError: "unknown",
                },
              }),
            ).pipe(
              map((_) => {
                throw e
              }),
            ),
          ),
          catchError((e) => {
            notifyError(e)

            Logger.error(e)

            return of(null)
          }),
        )
        .subscribe()
    } catch (e) {
      if (isPluginError(e) && e.code === "cancelled") return

      notifyError(e)

      Logger.error(e)
    }
  }
}
