import { useCallback } from "react"
import { showConfirmDialog } from "../common/dialogs/presets"

export const useCreateRequestPopupDialog = () => {
  return useCallback(
    ({ name }: { name: string }) =>
      () =>
        showConfirmDialog({
          title: `Plugin ${name} requires some actions`,
          message: `To proceed, the plugin ${name} requires some action from you which involve opening a popup`,
        }),
    [],
  )
}
