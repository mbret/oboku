import { from, of, switchMap } from "rxjs"
import type { AuthSessionResponseDto } from "@oboku/shared"
import type { QueryClient } from "@tanstack/react-query"
import {
  ensureActiveProfile,
  getActiveProfileId,
  setActiveProfileId,
} from "../profiles"
import type { Profile } from "../profiles/types"
import { resetSessionQueries } from "../queries/resetSessionQueries"

export const completeAuthentication = ({
  reCreateDb,
  putProfile,
  forgetAccountSessions,
  auth,
  queryClient,
}: {
  reCreateDb: (params: { overwrite: boolean }) => Promise<unknown>
  putProfile: (profile: Profile) => Promise<unknown>
  forgetAccountSessions: () => void
  auth: AuthSessionResponseDto
  queryClient: QueryClient
}) => {
  return from(ensureActiveProfile(queryClient, getActiveProfileId())).pipe(
    switchMap((previousAuth) => {
      /**
       * Whether the local database holds another account's data and must be
       * recreated. `previousAuth` is the still-active profile, which the
       * expired-session relogin path preserves — so a same-account relogin is
       * detected here and keeps the database (no needless re-replication for a
       * transient token death). An explicit sign-out instead clears the active
       * profile *and* wipes the local database (see `useSignOut`), so any later
       * sign-in re-replicates from empty regardless: the `true` this then yields
       * recreates an already-empty database by design, not a cross-account leak.
       */
      const switchedAccount = previousAuth?.email !== auth.email

      const waitForDbRecreation$ = switchedAccount
        ? from(reCreateDb({ overwrite: true }))
        : of(null)

      return waitForDbRecreation$.pipe(
        switchMap(async () => {
          await putProfile({
            id: auth.nameHex,
            email: auth.email,
            nameHex: auth.nameHex,
            dbName: auth.dbName,
            sessionId: auth.sessionId,
          })

          if (switchedAccount) {
            forgetAccountSessions()
          }

          setActiveProfileId(auth.nameHex)

          if (switchedAccount) {
            /**
             * The active profile id must name the new account before the reset:
             * `useQueryOptionsWithAuthentication` compares it with the account
             * each observer rendered for, so the reset's refetch skips the
             * previous account's observers.
             */
            await resetSessionQueries(queryClient)
          }

          return { switchedAccount }
        }),
      )
    }),
  )
}
