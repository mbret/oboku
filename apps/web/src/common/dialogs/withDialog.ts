import { type Observable, map, mergeMap } from "rxjs"
import type { CreateDialogOptions } from "./createDialog"
import { fromCreateDialog } from "./fromCreateDialog"

export const withDialog = <Result = undefined>(
  dialog: CreateDialogOptions<Result>,
) => {
  return <T>(stream: Observable<T>) =>
    stream.pipe(
      mergeMap((data) =>
        fromCreateDialog(dialog).pipe(
          map((dialogResult) => [data, dialogResult] as const),
        ),
      ),
    )
}
