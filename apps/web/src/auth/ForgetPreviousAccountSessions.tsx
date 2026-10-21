import { memo, useEffect } from "react"
import { filter, pairwise } from "rxjs"
import { usePluginsSignOut } from "../plugins/usePluginsSignOut"
import { activeProfileId$ } from "../profiles/active/activeProfileId"
import { clearTemporaryMasterKey } from "./AuthorizeActionDialog"

/**
 * Starts forgetting the previous account's sessions when the active profile
 * id leaves it, before anything renders for the next account.
 */
export const ForgetPreviousAccountSessions = memo(
  function ForgetPreviousAccountSessions() {
    const signOutPlugins = usePluginsSignOut()

    useEffect(
      function forgetSessionsOfEachLeftAccount() {
        const subscription = activeProfileId$
          .pipe(
            pairwise(),
            filter(function hasLeftAnAccount([previousId, nextId]) {
              return !!previousId && previousId !== nextId
            }),
          )
          .subscribe(function forgetLeftAccountSessions() {
            clearTemporaryMasterKey()
            signOutPlugins()
          })

        return function stopForgettingSessions() {
          subscription.unsubscribe()
        }
      },
      [signOutPlugins],
    )

    return null
  },
)
