import { defer, finalize, from } from "rxjs"
import { createDialog, type CreateDialogOptions } from "./createDialog"

export const fromCreateDialog = <Result = undefined>(
  options: CreateDialogOptions<Result>,
) => {
  return defer(() => {
    const dialog = createDialog<Result>(options)

    return from(dialog.promise).pipe(
      finalize(() => {
        dialog.close()
      }),
    )
  })
}
