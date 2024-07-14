import { API_URL } from "../constants"
import { plugins } from "./configure"
import { useCreateRequestPopupDialog } from "./useCreateRequestPopupDialog"
import { ObokuPlugin } from "./plugin-front"
import { useMutation } from "reactjrx"
import { from } from "rxjs"

const useDownloadBookPlaceholder = () => {
  return () => {
    throw new Error("this datasource cannot download")
  }
}

export const usePluginDownloadBook = () => {
  const createRequestPopupDialog = useCreateRequestPopupDialog()

  const pluginHooksResults = plugins.map((plugin) => {
    return {
      type: plugin.type,
      downloadBook: plugin.useDownloadBook
        ? plugin.useDownloadBook({
            apiUri: API_URL ?? "",
            requestPopup: createRequestPopupDialog({ name: plugin.name })
          })
        : // eslint-disable-next-line react-hooks/rules-of-hooks
          useDownloadBookPlaceholder()
    }
  })

  const downloadPluginBook: ReturnType<
    NonNullable<ObokuPlugin[`useDownloadBook`]>
  > = (options) => {
    const pluginHookResult = pluginHooksResults.find(
      (plugin) => plugin.type === options.link.type
    )

    if (!pluginHookResult) {
      throw new Error("no datasource found for this link")
    }

    return from(pluginHookResult.downloadBook(options))
  }

  return { downloadPluginBook }
}
