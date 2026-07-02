import { from, of, switchMap } from "rxjs"
import { setUser } from "@sentry/react"
import type { AuthSessionResponse } from "@oboku/shared"
import type { QueryClient } from "@tanstack/react-query"
import {
  activeProfileIdSignal,
  putProfileRow,
  setActiveProfileId,
} from "../profiles"
import { persister } from "../queries/persister"
import { profileByIdQueryKey } from "./authSession"
import { ensureActiveProfile } from "../profiles"

export const completeAuthentication = ({
  reCreateDb,
  auth,
  queryClient,
}: {
  reCreateDb: (params: { overwrite: boolean }) => Promise<unknown>
  auth: AuthSessionResponse
  queryClient: QueryClient
}) => {
  return from(
    ensureActiveProfile(queryClient, activeProfileIdSignal.getValue()),
  ).pipe(
    switchMap((previousAuth) => {
      const switchedAccount = previousAuth?.email !== auth.email

      const waitForDbRecreation$ = switchedAccount
        ? from(reCreateDb({ overwrite: true }))
        : of(null)

      return waitForDbRecreation$.pipe(
        switchMap(async () => {
          await putProfileRow({ id: auth.nameHex, ...auth })

          if (switchedAccount) {
            /**
             * Reset in-memory cache synchronously so stale cross-account data is
             * never visible under the new session—even if persister cleanup fails.
             * The auth/active-profile queries are written afterwards so the reset
             * cannot leave the new session momentarily cleared.
             */
            void queryClient.resetQueries()
            queryClient.getMutationCache().clear()
            void Promise.resolve(persister.removeClient())
          }

          setActiveProfileId(auth.nameHex)
          queryClient.setQueryData(profileByIdQueryKey(auth.nameHex), auth)
          setUser({ email: auth.email, id: auth.nameHex })

          return { switchedAccount }
        }),
      )
    }),
  )
}
