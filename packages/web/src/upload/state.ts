import { signal } from "reactjrx"

export const isUploadBookFromDataSourceDialogOpenedSignal = signal<
  string | undefined
>({
  default: undefined
})
