import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge"
import { Logger } from "../../../debug/logger.shared"

broadcastResponseToMainFrame().catch((error) => {
  Logger.error("Error broadcasting response:", error)
})
