import type { MessageDescriptor } from "@lingui/core"
import { msg } from "@lingui/core/macro"
import type { SignalValue } from "reactjrx"
import type { localSettingsSignal } from "../settings/useLocalSettings"

export const themeOptions = [
  { value: "light", label: msg`Light` },
  { value: "dark", label: msg`Dark` },
  { value: "e-ink", label: msg`E-ink` },
  { value: "system", label: msg`System` },
] satisfies {
  value: SignalValue<typeof localSettingsSignal>["themeMode"]
  label: MessageDescriptor
}[]
