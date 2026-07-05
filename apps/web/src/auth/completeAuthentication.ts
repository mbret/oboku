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
import { Logger } from "../debug/logger.shared"
import { promotePendingProofKey } from "./proofKey"

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
          try {
            await promotePendingProofKey()
          } catch (error) {
            Logger.error(
              "Failed to promote the refresh proof key; the session will require re-login once the access cookie expires",
              error,
            )
          }

          await putProfile({
            id: auth.nameHex,
            email: auth.email,
            nameHex: auth.nameHex,
            dbName: auth.dbName,
          })

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
