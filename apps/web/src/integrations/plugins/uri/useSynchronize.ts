import type { UseSynchronizeHook } from "../types"
import { createUnsupportedSynchronize } from "../common/createUnsupportedSynchronize"

export const useSynchronize: UseSynchronizeHook<"URI"> =
  createUnsupportedSynchronize<"URI">()
