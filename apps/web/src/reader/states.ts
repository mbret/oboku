import { signal } from "reactjrx"
import type { createAppReader } from "./createAppReader"

export type ReaderInstance = ReturnType<typeof createAppReader>

export const isMenuShownStateSignal = signal({
  key: "isMenuShownState",
  default: false,
})

// =======> Please do not forget to add atom to the reset part !
