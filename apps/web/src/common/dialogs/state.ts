import type { ReactNode } from "react"
import { signal } from "reactjrx"

type Preset = "NOT_IMPLEMENTED" | "OFFLINE" | "CONFIRM" | "UNKNOWN_ERROR"

export type DialogTemplateType<T = undefined> = {
  type?: "template"
  title?: string
  message?: string
  id: string
  preset?: Preset
  cancellable?: boolean
  dismissible?: boolean
  cancelTitle?: string
  confirmTitle?: string
  actions?: { title: string; type: "confirm"; onConfirm: () => T | null }[]
  onConfirm?: () => T | null
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
