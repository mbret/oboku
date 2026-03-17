import { from, of, tap } from "rxjs"
import { authStateSignal } from "./states.web"
import { setProfile, currentProfileSignal } from "../profile/currentProfile"
import { setUser } from "@sentry/react"

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
  const waitForDbRecreation$ =
    previousAuth?.email !== auth.email
      ? from(reCreateDb({ overwrite: true }))
      : of(null)

  return waitForDbRecreation$.pipe(
    tap(() => {
      authStateSignal.update(auth)
      setUser({ email: auth.email, id: auth.nameHex })
      setProfile(auth.nameHex)
      currentProfileSignal.update(auth.nameHex)
    }),
  )
}
