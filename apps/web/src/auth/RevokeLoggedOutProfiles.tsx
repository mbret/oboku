import { memo, useEffect } from "react"
import { useNetworkState } from "react-use"
import { useHasLoggedOutProfiles } from "../profiles"
import { useRevokeLoggedOutProfiles } from "./useRevokeLoggedOutProfiles"

export const RevokeLoggedOutProfiles = memo(function RevokeLoggedOutProfiles() {
  const { online } = useNetworkState()
  const { data: hasLoggedOutProfiles } = useHasLoggedOutProfiles()
  const { mutate: revokeLoggedOutProfiles } = useRevokeLoggedOutProfiles({
    meta: { suppressGlobalErrorToast: true },
  })

  useEffect(
    function revokeWhenOnlineWithLoggedOutProfiles() {
      if (online && hasLoggedOutProfiles) {
        revokeLoggedOutProfiles()
      }
    },
    [online, hasLoggedOutProfiles, revokeLoggedOutProfiles],
  )

  return null
})
