import { memo, useCallback } from "react"
import { useSubscribe } from "reactjrx"
import { filter, pairwise, tap } from "rxjs"
import { retryAndLogError } from "../common/rxjs/operators"
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

    const forgetSessionsOfLeftAccounts = useCallback(
      function forgetSessionsOfLeftAccounts() {
        return activeProfileId$.pipe(
          pairwise(),
          filter(function hasLeftAnAccount([previousId, nextId]) {
            return !!previousId && previousId !== nextId
          }),
          tap(function forgetLeftAccountSessions() {
            clearTemporaryMasterKey()
            signOutPlugins()
          }),
          retryAndLogError(),
        )
      },
      [signOutPlugins],
    )

    useSubscribe(forgetSessionsOfLeftAccounts)

    return null
  },
)
