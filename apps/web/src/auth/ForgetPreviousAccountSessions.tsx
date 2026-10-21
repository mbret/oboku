import { memo, useEffect } from "react"
import { filter, pairwise } from "rxjs"
import { usePluginsSignOut } from "../plugins/usePluginsSignOut"
import { activeProfileId$ } from "../profiles/active/activeProfileId"
import { clearTemporaryMasterKey } from "./AuthorizeActionDialog"

/**
 * Forgets the sessions this tab holds for an account once it leaves it, for
 * another account or for none: the temporary master key and the plugins'
 * sessions. A relogin to the same account keeps them, as it keeps the
 * database.
 *
 * It subscribes to the active profile id rather than reacting in a render
 * effect, so the sessions are gone before anything renders for the next
 * account.
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
