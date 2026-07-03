import { from, of, switchMap } from "rxjs"
import { setUser } from "@sentry/react"
import type { AuthSessionResponse } from "@oboku/shared"
import type { QueryClient } from "@tanstack/react-query"
import {
  activeProfileIdSignal,
  ensureActiveProfile,
  profileByIdQueryKey,
  setActiveProfileId,
} from "../profiles"
import type { Profile } from "../profiles/types"
import { resetSessionQueries } from "../queries/resetSessionQueries"

export const completeAuthentication = ({
  reCreateDb,
  putProfile,
  auth,
  queryClient,
}: {
  reCreateDb: (params: { overwrite: boolean }) => Promise<unknown>
  putProfile: (profile: Profile) => Promise<unknown>
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
          await putProfile({ id: auth.nameHex, ...auth })

          setActiveProfileId(auth.nameHex)
          setUser({ email: auth.email, id: auth.nameHex })

          if (switchedAccount) {
            /**
             * Commit the new session (profile row + active id) *before* resetting
             * so the refetches `resetQueries` triggers read the new account's
             * token rather than the previous one still cached under the old
             * profile. The active-profile query is kept so `hasSession` doesn't
             * blink empty mid-switch (see `resetSessionQueries`).
             */
            const activeProfileQueryKey = profileByIdQueryKey(auth.nameHex)

            resetSessionQueries(queryClient, {
              keepQuery: (query) =>
                query.queryKey[0] === activeProfileQueryKey[0] &&
                query.queryKey[1] === activeProfileQueryKey[1],
            })
          }

          return { switchedAccount }
        }),
      )
    }),
  )
}
