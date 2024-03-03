import { useCallback } from "react"
import { useDialogManager } from "../dialog"

export const useCreateRequestPopupDialog = () => {
  const dialog = useDialogManager()

  return useCallback(
    ({ name }: { name: string }) =>
      () =>
        new Promise<boolean>((resolve, reject) => {
          dialog({
            preset: "CONFIRM",
            title: `Plugin ${name} requires some actions`,
            content: `To proceed, the plugin ${name} requires some action from you which involve opening a popup`,
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false)
          })
        }),
    [dialog]
  )
}
