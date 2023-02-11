import { ObokuPlugin } from "@oboku/plugin-front"
import { useCallback, useRef } from "react"
import { useDialogManager } from "../dialog"
import { plugins } from "./configure"
import { useCreateRequestPopupDialog } from "./useCreateRequestPopupDialog"

export const usePluginRefreshMetadata = () => {
  const createRequestPopupDialog = useCreateRequestPopupDialog()
  const dialog = useDialogManager()

  // It's important to use array for plugins and be careful of the order since
  // it will trigger all hooks
  type UseRefreshMetadata =
    | ReturnType<NonNullable<ObokuPlugin[`useRefreshMetadata`]>>
    | undefined

  const getPluginFn = useRef<
    (Pick<(typeof plugins)[number], "type"> & {
      refreshMetadata: UseRefreshMetadata
    })[]
  >([])

  getPluginFn.current = plugins.map((plugin) => ({
    type: plugin.type,
    refreshMetadata:
      plugin.useRefreshMetadata &&
      plugin.useRefreshMetadata({
        requestPopup: createRequestPopupDialog({ name: plugin.name })
      })
  }))

  const refreshMetadata: ReturnType<
    NonNullable<ObokuPlugin[`useRefreshMetadata`]>
  > = async (link) => {
    const found = getPluginFn.current.find(
      (plugin) => plugin.type === link.type
    )
    if (found) {
      if (!found.refreshMetadata) {
        throw new Error("this datasource cannot fetch metadata")
      }

      return await found.refreshMetadata(link)
    }

    throw new Error("no datasource found for this link")
  }

  return useCallback(refreshMetadata, [getPluginFn, dialog])
}
