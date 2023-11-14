import { useCallback, useRef } from "react"
import { API_URI } from "../constants"
import { useDialogManager } from "../dialog"
import { plugins } from "./configure"
import { useCreateRequestPopupDialog } from "./useCreateRequestPopupDialog"
import { ObokuPlugin } from "./plugin-front"

export const useDownloadBookFromDataSource = () => {
  const dialog = useDialogManager()
  const createRequestPopupDialog = useCreateRequestPopupDialog()

  // It's important to use array for plugins and be careful of the order since
  // it will trigger all hooks
  type UseDownloadBook =
    | ReturnType<NonNullable<ObokuPlugin[`useDownloadBook`]>>
    | undefined

  const getPluginFn = useRef<
    (Pick<(typeof plugins)[number], "type"> & {
      downloadBook: UseDownloadBook
    })[]
  >([])

  getPluginFn.current = plugins.map((plugin) => ({
    type: plugin.type,
    downloadBook:
      plugin.useDownloadBook &&
      plugin.useDownloadBook({
        apiUri: API_URI,
        requestPopup: createRequestPopupDialog({ name: plugin.name })
      })
  }))

  const downloadBook: ReturnType<
    NonNullable<ObokuPlugin[`useDownloadBook`]>
  > = async (link, options) => {
    const found = getPluginFn.current.find(
      (plugin) => plugin.type === link.type
    )
    if (found) {
      if (!found.downloadBook) {
        throw new Error("this datasource cannot download")
      }

      return await found.downloadBook(link, options)
    }

    throw new Error("no datasource found for this link")
  }

  return useCallback(downloadBook, [getPluginFn])
}
