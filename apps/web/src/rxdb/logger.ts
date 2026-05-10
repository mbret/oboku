import { Logger as SharedLogger } from "../debug/logger.shared"

export const Logger = SharedLogger.namespace("rxdb", undefined, {
  color: "#2c7be5",
})
