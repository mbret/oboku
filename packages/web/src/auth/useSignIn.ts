import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { useCallback } from "react"
import { catchError, finalize, from, of, switchMap, tap } from "rxjs"
import { lock, unlock } from "../common/BlockingBackdrop"
import { API_URL } from "../constants"
import { CancelError } from "../common/errors/errors"
import { useReCreateDb } from "../rxdb"
import { authStateSignal } from "./authState"
import { httpClient } from "../http/httpClient"
import { setProfile } from "../profile/currentProfile"
import { setUser } from "@sentry/react"
import { currentProfileSignal } from "../profile/currentProfile"

const provider = new GoogleAuthProvider()

const auth = getAuth()

export const useSignIn = () => {
  const { mutateAsync: reCreateDb } = useReCreateDb()

  const signIn = useCallback(() => {
    lock("authentication")

    return from(signInWithPopup(auth, provider)).pipe(
      catchError((e) => {
        if (e.code === "auth/popup-closed-by-user") throw new CancelError()

        throw e
      }),
      switchMap((authResponse) => authResponse.user.getIdToken()),
      switchMap((token) =>
        from(
          httpClient.post<{
            dbName: string
            email: string
            token: string
            nameHex: string
          }>({
            url: `${API_URL}/signin`,
            body: {
              token
            }
          })
        )
      ),
      switchMap(({ data: { dbName, email, token, nameHex } }) =>
        of(authStateSignal.getValue()).pipe(
          switchMap((previousAuth) =>
            previousAuth?.email !== email
              ? from(reCreateDb({ overwrite: true }))
              : of(previousAuth)
          ),
          tap(() => {
            authStateSignal.setValue({ dbName, email, token, nameHex })

            setUser({ email, id: nameHex })

            setProfile(nameHex)
            currentProfileSignal.setValue(nameHex)
          })
        )
      ),
      finalize(() => {
        unlock("authentication")
      })
    )
  }, [reCreateDb])

  return { signIn }
}
