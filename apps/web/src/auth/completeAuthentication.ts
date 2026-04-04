import { from, of, switchMap, tap } from "rxjs"
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
    switchMap(() => {
      if (!switchedAccount) {
        return of(null)
      }

      return from(Promise.resolve(persister.removeClient())).pipe(
        tap(() => {
          /**
           * Drop persisted React Query state for the previous account, then reset
           * the in-memory cache so active queries refetch (see useSignOut).
           */
          void queryClient.resetQueries()
          queryClient.getMutationCache().clear()
        }),
      )
    }),
  )
}
