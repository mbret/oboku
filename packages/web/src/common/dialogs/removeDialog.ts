import { dialogSignal } from "./state"

export const removeDialog = (id: string) => [
  dialogSignal.setValue((old) => old.filter((dialog) => id !== dialog.id)),
]
