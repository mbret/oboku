import { useCallback, useRef } from "react"
import { plugins } from "./configure"
import { useCreateRequestPopupDialog } from "./useCreateRequestPopupDialog"
import type { ObokuPlugin } from "./types"
import type { DataSourceDocType } from "@oboku/shared"

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
    // biome-ignore lint/correctness/useHookAtTopLevel: Expected
    refreshMetadata: plugin.useRefreshMetadata?.({
      requestPopup: createRequestPopupDialog({ name: plugin.name }),
    }),
  }))

  return useCallback(
    async ({
      linkType,
      linkData,
      linkResourceId,
    }: {
      linkType: DataSourceDocType["type"]
      linkData: Record<string, unknown>
      linkResourceId?: string
    }): Promise<{ data?: Record<string, unknown> }> => {
      const found = getPluginFn.current.find(
        (plugin) => plugin.type === linkType,
      )

      if (found) {
        if (!found.refreshMetadata) {
          return {}
        }

        return await found.refreshMetadata.mutateAsync({
          linkType,
          linkData,
          linkResourceId,
        })
      }

      return {}
    },
    [],
  )
}
