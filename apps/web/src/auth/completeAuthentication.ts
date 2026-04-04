import { from, of, tap } from "rxjs"
import { authStateSignal } from "./states.web"
import { setProfile, currentProfileSignal } from "../profile/currentProfile"
import { setUser } from "@sentry/react"
import { queryClient } from "../queries/queryClient"
import { persister } from "../queries/persister"

type AuthResponse = {
  dbName: string
  email: string
  accessToken: string
  refreshToken: string
  nameHex: string
}

export const completeAuthentication = ({
  reCreateDb,
  auth,
}: {
  reCreateDb: (params: { overwrite: boolean }) => Promise<unknown>
  auth: AuthResponse
}) => {
  const previousAuth = authStateSignal.value
  const switchedAccount = previousAuth?.email !== auth.email

  const waitForDbRecreation$ = switchedAccount
    ? from(reCreateDb({ overwrite: true }))
    : of(null)

  return waitForDbRecreation$.pipe(
    tap(() => {
      authStateSignal.update(auth)
      setUser({ email: auth.email, id: auth.nameHex })
      setProfile(auth.nameHex)
      currentProfileSignal.update(auth.nameHex)
    }),
    tap(() => {
      if (!switchedAccount) return

      /**
       * Reset in-memory cache synchronously so stale cross-account data is
       * never visible under the new session—even if persister cleanup fails.
       */
      void queryClient.resetQueries()
      queryClient.getMutationCache().clear()
      void Promise.resolve(persister.removeClient())
    }),
  )
}
