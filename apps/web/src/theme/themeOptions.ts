import type { SignalValue } from "reactjrx"
import type { localSettingsSignal } from "../settings/states"

export const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "e-ink", label: "E-ink" },
  { value: "system", label: "System" },
] satisfies {
  value: SignalValue<typeof localSettingsSignal>["themeMode"]
  label: string
}[]
