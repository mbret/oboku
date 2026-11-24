import { createBroadcast } from "../common/browser"

export const DOWNLOADS_BROADCAST_CHANNEL = "oboku:downloads"

export const downloadsBroadcast = createBroadcast<"downloads-changed">(
  DOWNLOADS_BROADCAST_CHANNEL,
)
