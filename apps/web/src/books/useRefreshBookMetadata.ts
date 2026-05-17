import { useNetworkState } from "react-use"
import { httpClientApi } from "../http/httpClientApi.web"
import { usePluginRefreshMetadata } from "../plugins/usePluginRefreshMetadata"
import { useDatabase } from "../rxdb"
import { Logger } from "../debug/logger.shared"
import { showDialog } from "../common/dialogs/createDialog"
import { useIncrementalBookPatch } from "./useIncrementalBookPatch"
import { CancelError } from "../errors/errors.shared"
import { notifyError } from "../notifications/toasts"

export const useRefreshBookMetadata = () => {
  const { db: database } = useDatabase()
  const { mutateAsync: incrementalPatchBook } = useIncrementalBookPatch()
  const network = useNetworkState()
  const refreshPluginMetadata = usePluginRefreshMetadata()

  return async (bookId: string, { force }: { force?: boolean } = {}) => {
    try {
      if (!network.online) {
        showDialog({ preset: "OFFLINE" })

        return
      }

      if (!database) return

      const book = await database.book
        .findOne({ selector: { _id: bookId } })
        .exec()

      const firstLink = await database.link
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

      await incrementalPatchBook({
        doc: bookId,
        patch: {
          metadataUpdateStatus: "fetching",
        },
      })

      try {
        await httpClientApi.refreshBookMetadata({
          bookId,
          providerCredentials,
          force,
        })
      } catch (e) {
        await incrementalPatchBook({
          doc: bookId,
          patch: {
            metadataUpdateStatus: null,
            lastMetadataUpdateError: "unknown",
          },
        })

        throw e
      }
    } catch (e) {
      if (e instanceof CancelError) return

      notifyError(e)

      Logger.error(e)
    }
  }
}
