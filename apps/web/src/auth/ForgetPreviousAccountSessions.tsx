import { memo } from "react"
import { useSubscribe } from "reactjrx"
import { filter, pairwise, tap } from "rxjs"
import { retryAndLogError } from "../common/rxjs/operators"
import { usePluginsSignOut } from "../plugins/usePluginsSignOut"
import { activeProfileId$ } from "../profiles/active/activeProfileId"
import { clearTemporaryMasterKey } from "./AuthorizeActionDialog"

/**
 * Starts forgetting the sessions held for the previous account each time the
 * active profile id changes, before anything renders for the next one.
 */
export const ForgetPreviousAccountSessions = memo(
  function ForgetPreviousAccountSessions() {
    const signOutPlugins = usePluginsSignOut()

    useSubscribe(function forgetSessionsOnAccountChange() {
      return activeProfileId$.pipe(
        pairwise(),
        filter(function hasAccountChanged([previousId, nextId]) {
          return previousId !== nextId
        }),
        tap(function forgetPreviousAccountSessions() {
          clearTemporaryMasterKey()
          signOutPlugins()
        }),
        retryAndLogError(),
      )
    })

    return null
  },
)
