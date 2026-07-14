import { createBroadcast } from "../common/browser"

export const PROFILES_BROADCAST_CHANNEL = "oboku:profiles"

export const profilesBroadcast = createBroadcast<"profiles-changed">(
  PROFILES_BROADCAST_CHANNEL,
)
