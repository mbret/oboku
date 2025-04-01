import { signal } from "reactjrx"

type Preset = "NOT_IMPLEMENTED" | "OFFLINE" | "CONFIRM" | "UNKNOWN_ERROR"

export type DialogType<T = undefined> = {
  title?: string
  content?: string
  id: string
  preset?: Preset
  cancellable?: boolean
  canEscape?: boolean
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
