import { useNetworkState } from "react-use"
import { useHttpClientApi } from "../http"
import { usePluginRefreshMetadata } from "../plugins/usePluginRefreshMetadata"
import { useDatabase } from "../rxdb"
import { Logger } from "../debug/logger.shared"
import { showDialog } from "../common/dialogs/createDialog"
import { createOfflineDialogOptions } from "../common/dialogs/presets"
import { useIncrementalBookPatch } from "./useIncrementalBookPatch"
import { CancelError } from "../errors/errors.shared"
import { notifyError } from "../notifications/toasts"

/**
 * This flow reports every failure itself through `notifyError`, so the
 * mutations it drives must not also raise the global toast.
 */
const withoutGlobalErrorToast = { meta: { suppressGlobalErrorToast: true } }

export const useRefreshBookMetadata = () => {
  const httpClientApi = useHttpClientApi()
  const { db: database } = useDatabase()
  const { mutateAsync: incrementalPatchBook } = useIncrementalBookPatch(
    withoutGlobalErrorToast,
  )
  const network = useNetworkState()
  const refreshPluginMetadata = usePluginRefreshMetadata(
    withoutGlobalErrorToast,
  )

  return async (bookId: string, { force }: { force?: boolean } = {}) => {
    try {
      if (!network.online) {
        showDialog(createOfflineDialogOptions())

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
