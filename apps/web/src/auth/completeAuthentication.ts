import { from, map, of } from "rxjs"
import { authStateSignal } from "./states.web"
import { setProfile, currentProfileSignal } from "../profiles"
import { setUser } from "@sentry/react"
import { persister } from "../queries/persister"
import type { AuthSessionResponse } from "@oboku/shared"
import type { QueryClient } from "@tanstack/react-query"

export const completeAuthentication = ({
  reCreateDb,
  auth,
  queryClient,
}: {
  reCreateDb: (params: { overwrite: boolean }) => Promise<unknown>
  auth: AuthSessionResponse
  queryClient: QueryClient
}) => {
  const previousAuth = authStateSignal.value
  const switchedAccount = previousAuth?.email !== auth.email

  const waitForDbRecreation$ = switchedAccount
    ? from(reCreateDb({ overwrite: true }))
    : of(null)

  return waitForDbRecreation$.pipe(
    map(() => {
      authStateSignal.update(auth)
      setUser({ email: auth.email, id: auth.nameHex })
      setProfile(auth.nameHex)
      currentProfileSignal.update(auth.nameHex)

      if (switchedAccount) {
        /**
         * Reset in-memory cache synchronously so stale cross-account data is
         * never visible under the new session—even if persister cleanup fails.
         */
        void queryClient.resetQueries()
        queryClient.getMutationCache().clear()
        void Promise.resolve(persister.removeClient())
      }

      return { switchedAccount }
    }),
  )
}
