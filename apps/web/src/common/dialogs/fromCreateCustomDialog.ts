import { defer, finalize, from } from "rxjs"
import {
  createCustomDialog,
  type CreateCustomDialogOptions,
} from "./createCustomDialog"

type FromCreateCustomDialogOptions<Result> =
  CreateCustomDialogOptions<Result> & {
    /**
     * Keep the dialog open if the observable subscription is cancelled.
     * The dialog still closes when its controls confirm or cancel.
     */
    fireAndForget?: boolean
  }

export const fromCreateCustomDialog = <Result = undefined>({
  fireAndForget = false,
  ...options
}: FromCreateCustomDialogOptions<Result>) => {
  return defer(() => {
    const dialog = createCustomDialog<Result>(options)
    const dialogResult$ = from(dialog.promise)

    if (fireAndForget) {
      return dialogResult$
    }

    return dialogResult$.pipe(
      finalize(() => {
        dialog.close()
      }),
    )
  })
}
