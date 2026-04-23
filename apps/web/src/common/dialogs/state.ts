import type { ReactNode } from "react"
import { signal } from "reactjrx"

type Preset = "NOT_IMPLEMENTED" | "OFFLINE" | "CONFIRM" | "UNKNOWN_ERROR"

export type DialogType<T = undefined> = {
  title?: string
  content?: ReactNode
  id: string
  preset?: Preset
  cancellable?: boolean
  dismissible?: boolean
  cancelTitle?: string
  confirmTitle?: string
  actions?: { title: string; type: "confirm"; onConfirm: () => T }[]
  onConfirm?: () => T
  onClose?: () => void
  onCancel?: () => void
}

export const dialogSignal = signal<DialogType<unknown>[]>({
  default: [],
})
