import { useCallback } from "react"
import { createDialog } from "../common/dialogs/createDialog"

export const useCreateRequestPopupDialog = () => {
  return useCallback(
    ({ name }: { name: string }) =>
      () =>
        new Promise<boolean>((resolve) => {
          createDialog({
            preset: "CONFIRM",
            title: `Plugin ${name} requires some actions`,
            content: `To proceed, the plugin ${name} requires some action from you which involve opening a popup`,
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false)
          })
        }),
    []
  )
}
