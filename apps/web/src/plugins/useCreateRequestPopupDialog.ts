import { useCallback } from "react"
import { createDialog } from "../common/dialogs/createDialog"

export const useCreateRequestPopupDialog = () => {
  return useCallback(
    ({ name }: { name: string }) =>
      async () => {
        return createDialog({
          preset: "CONFIRM",
          title: `Plugin ${name} requires some actions`,
          message: `To proceed, the plugin ${name} requires some action from you which involve opening a popup`,
        })
          .promise.then(() => true)
          .catch(() => false)
      },
    [],
  )
}
