import { useMemo } from "react"
import { useCreateRequestPopupDialog } from "./useCreateRequestPopupDialog"

export const useRequestPopupDialog = (name: string) => {
  const createRequestPopupDialog = useCreateRequestPopupDialog()

  return useMemo(
    () => createRequestPopupDialog({ name }),
    [createRequestPopupDialog, name],
  )
}
