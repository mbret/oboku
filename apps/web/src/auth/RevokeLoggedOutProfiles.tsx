import { memo, useEffect } from "react"
import { useRevokeLoggedOutProfiles } from "./useRevokeLoggedOutProfiles"

export const RevokeLoggedOutProfiles = memo(function RevokeLoggedOutProfiles() {
  const { mutate: revokeLoggedOutProfiles } = useRevokeLoggedOutProfiles({
    meta: { suppressGlobalErrorToast: true },
  })

  useEffect(
    function revokeOnBootAndWhenBackOnline() {
      const runBestEffortRevoke = () => {
        revokeLoggedOutProfiles()
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
