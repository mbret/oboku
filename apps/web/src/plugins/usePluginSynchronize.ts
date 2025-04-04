import type { DataSourceDocType } from "@oboku/shared"
import { useCallback, useRef } from "react"
import { plugins } from "./configure"
import { useCreateRequestPopupDialog } from "./useCreateRequestPopupDialog"
import type { ObokuPlugin } from "./types"

export const usePluginSynchronize = () => {
  const createRequestPopupDialog = useCreateRequestPopupDialog()

  // It's important to use array for plugins and be careful of the order since
  // it will trigger all hooks
  type UseHook =
    | ReturnType<NonNullable<ObokuPlugin[`useSynchronize`]>>
    | undefined

  const getPluginFn = useRef<
    (Pick<(typeof plugins)[number], "type"> & {
      synchronize: UseHook
    })[]
  >([])

  getPluginFn.current = plugins.map((plugin) => ({
    type: plugin.type,
    synchronize: plugin.useSynchronize?.({
      requestPopup: createRequestPopupDialog({ name: plugin.name }),
    }),
  }))

  const execute = async (dataSource: DataSourceDocType) => {
    const found = getPluginFn.current.find(
      (plugin) => plugin.type === dataSource.type,
    )
    if (found) {
      if (!found.synchronize) {
        throw new Error("this datasource cannot synchronize")
      }

      return await found.synchronize()
    }

    throw new Error("no datasource found for this link")
  }

  return useCallback(execute, [])
}
