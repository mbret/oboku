import { from, of, switchMap } from "rxjs"
import { setUser } from "@sentry/react"
import type { AuthSessionResponse } from "@oboku/shared"
import type { QueryClient } from "@tanstack/react-query"
import {
  activeProfileIdSignal,
  ensureActiveProfile,
  setActiveProfileId,
} from "../profiles"
import type { Profile } from "../profiles/types"
import { resetSessionQueries } from "../queries/resetSessionQueries"
import { persistProofKey, type StoredProofKey } from "./proofKey"

export const completeAuthentication = ({
  reCreateDb,
  putProfile,
  auth,
  proofKey,
  queryClient,
}: {
  reCreateDb: (params: { overwrite: boolean }) => Promise<unknown>
  putProfile: (profile: Profile) => Promise<unknown>
  auth: AuthSessionResponse
  proofKey: StoredProofKey
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
          await persistProofKey(proofKey)

          await putProfile({ id: auth.nameHex, ...auth })

          setActiveProfileId(auth.nameHex)
          setUser({ email: auth.email, id: auth.nameHex })

          if (switchedAccount) {
            /**
             * Commit the new session (profile row + active id) *before* resetting
             * so the refetches `resetQueries` triggers read the new account's
             * token rather than the previous one still cached under the old
             * profile.
             */
            resetSessionQueries(queryClient)
          }

          return { switchedAccount }
        }),
      )
    }),
  )
}
