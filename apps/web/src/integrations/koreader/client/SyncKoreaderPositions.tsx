import { memo } from "react"
import { useSyncKoreaderPositions } from "./useSyncKoreaderPositions"

export const SyncKoreaderPositions = memo(function SyncKoreaderPositions() {
  useSyncKoreaderPositions()

  return null
})
