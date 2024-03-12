import { useNetworkState } from "react-use"
import { from, switchMap, catchError, map, EMPTY } from "rxjs"
import { useDialogManager } from "../dialog"
import { httpClient } from "../http/httpClient"
import { isPluginError } from "../plugins/plugin-front"
import { usePluginRefreshMetadata } from "../plugins/usePluginRefreshMetadata"
import { useDatabase } from "../rxdb"
import { useSyncReplicate } from "../rxdb/replication/useSyncReplicate"
import { useAtomicUpdateBook } from "./helpers"
import { Report } from "../debug/report.shared"

export const useRefreshBookMetadata = () => {
  const { db: database } = useDatabase()
  const [updateBook] = useAtomicUpdateBook()
  const dialog = useDialogManager()
  const network = useNetworkState()
  const { mutateAsync: sync } = useSyncReplicate()
  const refreshPluginMetadata = usePluginRefreshMetadata()

  return async (bookId: string) => {
    try {
      if (!network.online) {
        return dialog({ preset: "OFFLINE" })
      }

      const book = await database?.book
        .findOne({ selector: { _id: bookId } })
        .exec()

      const firstLink = await database?.link
        .findOne({ selector: { _id: book?.links[0] } })
        .exec()

      if (!firstLink) {
        Report.warn(`Trying to refresh metadata of file item ${bookId}`)

        return
      }

      const { data: pluginMetadata } = await refreshPluginMetadata({
        linkType: firstLink.type
      })

      if (!database) return

      from(
        updateBook(bookId, (old) => ({
          ...old,
          metadataUpdateStatus: "fetching"
        }))
      )
        .pipe(
          switchMap(() => from(sync([database.link, database.book]))),
          switchMap(() =>
            from(httpClient.refreshBookMetadata(bookId, pluginMetadata))
          ),
          catchError((e) =>
            from(
              updateBook(bookId, (old) => ({
                ...old,
                metadataUpdateStatus: null,
                lastMetadataUpdateError: "unknown"
              }))
            ).pipe(
              map((_) => {
                throw e
              })
            )
          ),
          catchError((e) => {
            Report.error(e)

            return EMPTY
          })
        )
        .subscribe()
    } catch (e) {
      if (isPluginError(e) && e.code === "cancelled") return

      Report.error(e)
    }
  }
}
