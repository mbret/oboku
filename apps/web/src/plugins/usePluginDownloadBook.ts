import { plugins } from "./configure"
import { useCreateRequestPopupDialog } from "./useCreateRequestPopupDialog"
import type { ObokuPlugin } from "./types"
import { from } from "rxjs"

const useDownloadBookPlaceholder = () => {
  return () => {
    throw new Error("This book cannot be downloaded")
  }
}

export const usePluginDownloadBook = () => {
  const createRequestPopupDialog = useCreateRequestPopupDialog()

  const pluginHooksResults = plugins.map((plugin) => {
    return {
      type: plugin.type,
      downloadBook: plugin.useDownloadBook
        ? plugin.useDownloadBook({
            requestPopup: createRequestPopupDialog({ name: plugin.name }),
          })
        : useDownloadBookPlaceholder(),
    }
  })

  const downloadPluginBook: ReturnType<
    NonNullable<ObokuPlugin[`useDownloadBook`]>
  > = (options) => {
    const pluginHookResult = pluginHooksResults.find(
      (plugin) => plugin.type === options.link.type,
    )

    if (!pluginHookResult) {
      throw new Error("no datasource found for this link")
    }

    return from(pluginHookResult.downloadBook(options))
  }

  return { downloadPluginBook }
}
