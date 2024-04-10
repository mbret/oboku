import { Observable, map, mergeMap } from "rxjs"
import { DialogType } from "./state"
import { createDialog } from "./createDialog"

export const withDialog = <Result = undefined>(
  dialog: Omit<DialogType<Result>, "id">
) => {
  return <T>(stream: Observable<T>) =>
    stream.pipe(
      mergeMap((data) =>
        createDialog(dialog).$.pipe(
          map((dialogResult) => [data, dialogResult] as const)
        )
      )
    )
}
