import type { UseSyncSourceInfo } from "../types"
import { ONE_DRIVE_PLUGIN_NAME } from "./constants"

export const useSyncSourceInfo: UseSyncSourceInfo<"one-drive"> = () => {
  return {
    name: ONE_DRIVE_PLUGIN_NAME,
  }
}
