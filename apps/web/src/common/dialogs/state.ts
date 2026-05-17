import type { ReactNode } from "react"
import { signal } from "reactjrx"

type DialogButtonVariant = "text" | "outlined" | "contained"

export type DialogAction<T = undefined> = {
  title: string
  variant?: DialogButtonVariant
  autoFocus?: boolean
  onAction: () => T | null
}

export type DialogTemplateType<T = undefined> = {
  type?: "template"
  title?: string
  message?: string
  id: string
  cancellable?: boolean
  dismissible?: boolean
  cancelTitle?: string
  cancelResult?: T | null
  cancelButtonVariant?: DialogButtonVariant
  cancelButtonAutoFocus?: boolean
  actions?: DialogAction<T>[]
  onClose?: () => void
  onCancel?: () => void
}

export type CustomDialogType = {
  type: "custom"
  id: string
  render: () => ReactNode
}

export type DialogType<T = undefined> = DialogTemplateType<T> | CustomDialogType

export const dialogSignal = signal<DialogType<unknown>[]>({
  default: [],
})
