import { useNetworkState } from "react-use"
import { from, switchMap, catchError, map, of, EMPTY } from "rxjs"
import { httpClientApi } from "../http/httpClientApi.web"
import { usePluginRefreshMetadata } from "../plugins/usePluginRefreshMetadata"
import { useDatabase } from "../rxdb"
import { Logger } from "../debug/logger.shared"
import { createDialog } from "../common/dialogs/createDialog"
import { useIncrementalBookPatch } from "./useIncrementalBookPatch"
import { CancelError } from "../errors/errors.shared"
import { useToasts } from "../notifications/useToasts"

export const useRefreshBookMetadata = () => {
  const { db: database } = useDatabase()
  const { mutateAsync: incrementalPatchBook } = useIncrementalBookPatch()
  const network = useNetworkState()
  const refreshPluginMetadata = usePluginRefreshMetadata()
  const { notifyError } = useToasts()

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

      const { providerCredentials } = await refreshPluginMetadata({
        linkId: firstLink._id,
        linkType: firstLink.type,
        linkData: firstLink.data,
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
          switchMap(() =>
            httpClientApi.refreshBookMetadata({
              bookId,
              providerCredentials: providerCredentials,
            }),
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
            if (e instanceof CancelError) return EMPTY

            notifyError(e)

            Logger.error(e)

            return of(null)
          }),
        )
        .subscribe()
    } catch (e) {
      if (e instanceof CancelError) return

      notifyError(e)

      Logger.error(e)
    }
  }
}
