import { useCallback } from "react"
import { createDialog } from "../common/dialogs/createDialog"
import { createConfirmDialogOptions } from "../common/dialogs/presets"

export const useCreateRequestPopupDialog = () => {
  return useCallback(
    ({ name }: { name: string }) =>
      async () =>
        (await createDialog(
          createConfirmDialogOptions({
            title: `Plugin ${name} requires some actions`,
            message: `To proceed, the plugin ${name} requires some action from you which involve opening a popup`,
          }),
        ).promise) ?? false,
    [],
  )
}
