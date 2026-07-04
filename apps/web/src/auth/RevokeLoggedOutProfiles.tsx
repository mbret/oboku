import { memo, useEffect } from "react"
import { Logger } from "../debug/logger.shared"
import { useRevokeLoggedOutProfiles } from "./useRevokeLoggedOutProfiles"

export const RevokeLoggedOutProfiles = memo(function RevokeLoggedOutProfiles() {
  const revokeLoggedOutProfiles = useRevokeLoggedOutProfiles()

  useEffect(
    function revokeOnBootAndWhenBackOnline() {
      const runBestEffortRevoke = () => {
        revokeLoggedOutProfiles().catch(function onUnexpectedSweepError(error) {
          Logger.error(error)
        })
      }

      runBestEffortRevoke()

      window.addEventListener("online", runBestEffortRevoke)

      return function stopListeningForOnline() {
        window.removeEventListener("online", runBestEffortRevoke)
      }
    },
    [revokeLoggedOutProfiles],
  )

  return null
})
