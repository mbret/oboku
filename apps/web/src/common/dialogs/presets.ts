import type { CreateDialogOptions } from "./createDialog"

export const createConfirmDialogOptions = <Result = undefined>(
  options: CreateDialogOptions<Result> = {},
): CreateDialogOptions<Result> => {
  const actions = options.actions?.length ? options.actions : [{ title: "Ok" }]

  return {
    ...options,
    title: options.title || "Hold on a minute!",
    message:
      options.message || "Are you sure you want to proceed with this action?",
    cancellable: options.cancellable ?? true,
    cancelButtonVariant: options.cancelButtonVariant ?? "contained",
    cancelButtonAutoFocus: options.cancelButtonAutoFocus ?? true,
    actions: actions.map((action) => ({
      ...action,
      variant: action.variant ?? "outlined",
      autoFocus: action.autoFocus ?? false,
    })),
  }
}

export const createNotImplementedDialogOptions = (
  options: CreateDialogOptions = {},
): CreateDialogOptions => ({
  title: "Not implemented",
  message: "Sorry this feature is not yet implemented",
  dismissible: true,
  ...options,
})

export const createOfflineDialogOptions = (
  options: CreateDialogOptions = {},
): CreateDialogOptions => ({
  title: "Offline is great but...",
  message: "You need to be online to proceed with this action",
  ...options,
})

export const createUnknownErrorDialogOptions = (
  options: CreateDialogOptions = {},
): CreateDialogOptions => ({
  title: "Oups, something went wrong!",
  message:
    "Something unexpected happened and oboku could not proceed with your action. Maybe you can try again?",
  ...options,
})
