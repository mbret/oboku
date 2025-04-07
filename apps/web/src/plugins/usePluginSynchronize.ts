import type { DataSourceDocType } from "@oboku/shared"
import { useCallback, useRef } from "react"
import { type Plugin, plugins } from "./configure"
import { useCreateRequestPopupDialog } from "./useCreateRequestPopupDialog"

export const usePluginSynchronize = () => {
  const createRequestPopupDialog = useCreateRequestPopupDialog()

  // It's important to use array for plugins and be careful of the order since
  // it will trigger all hooks
  type UseHook = ReturnType<NonNullable<Plugin["useSynchronize"]>> | undefined

  const getPluginFn = useRef<
    {
      type: Plugin["type"]
      synchronize: UseHook
    }[]
  >([])

  getPluginFn.current = plugins.map((plugin) => {
    const hookRan = plugin.useSynchronize?.({
      requestPopup: createRequestPopupDialog({ name: plugin.name }),
    })

    return {
      type: plugin.type,
      synchronize: hookRan,
    }
  })

  const execute = async (dataSource: DataSourceDocType) => {
    const found = getPluginFn.current.find(
      (plugin) => plugin.type === dataSource.type,
    )

    if (found) {
      if (!found.synchronize) {
        throw new Error("this datasource cannot synchronize")
      }

      return await found.synchronize(dataSource as any)
    }

    throw new Error("no datasource found for this link")
  }

  return useCallback(execute, [])
}
