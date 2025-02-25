import { useCallback, useRef } from "react"
import { plugins } from "./configure"
import { useCreateRequestPopupDialog } from "./useCreateRequestPopupDialog"
import type { ObokuPlugin } from "./types"

export const usePluginRefreshMetadata = () => {
  const createRequestPopupDialog = useCreateRequestPopupDialog()

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
    refreshMetadata: plugin.useRefreshMetadata?.({
      requestPopup: createRequestPopupDialog({ name: plugin.name }),
    }),
  }))

  const refreshMetadata: ReturnType<
    NonNullable<ObokuPlugin[`useRefreshMetadata`]>
  > = async ({ linkType }) => {
    const found = getPluginFn.current.find((plugin) => plugin.type === linkType)

    if (found) {
      if (!found.refreshMetadata) {
        return {}
      }

      return await found.refreshMetadata({ linkType })
    }

    return {}
  }

  return useCallback(refreshMetadata, [getPluginFn])
}
