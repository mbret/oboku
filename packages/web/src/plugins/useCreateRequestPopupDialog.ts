import { useCallback } from "react"
import { createDialog } from "../common/dialogs/createDialog"
import { lastValueFrom } from "rxjs"

export const useCreateRequestPopupDialog = () => {
  return useCallback(
    ({ name }: { name: string }) =>
      async () => {
        return lastValueFrom(
          createDialog({
            preset: "CONFIRM",
            title: `Plugin ${name} requires some actions`,
            content: `To proceed, the plugin ${name} requires some action from you which involve opening a popup`
          }).$
        )
          .then(() => true)
          .catch(() => false)
      },
    []
  )
}
