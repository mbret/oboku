import { dialogSignal } from "./state"

export const removeDialog = (id: string) => {
  dialogSignal.update((old) => old.filter((dialog) => id !== dialog.id))
}
