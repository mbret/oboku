import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { catchError, finalize, from, of, switchMap, tap } from "rxjs"
import { lock, unlock } from "../common/BlockingBackdrop"
import { useReCreateDb } from "../rxdb"
import { authStateSignal } from "./authState"
import { httpClient } from "../http/httpClient"
import { setProfile } from "../profile/currentProfile"
import { setUser } from "@sentry/react"
import { currentProfileSignal } from "../profile/currentProfile"
import { CancelError } from "../errors/errors.shared"
import { API_URL } from "../constants.shared"
import { useMutation$ } from "reactjrx"
import { configuration } from "../config/configuration"

const provider = new GoogleAuthProvider()

export const useSignIn = () => {
  const { mutateAsync: reCreateDb } = useReCreateDb()

  return useMutation$({
    mutationFn: () => {
      lock("authentication")

      /**
       * @important
       * This should be at the root of module but there is a bug where events
       * get added forever.
       * @see https://github.com/firebase/firebase-js-sdk/issues/8642
       */
      const auth = getAuth()

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
              url: `${configuration.API_URL}/auth/signin`,
              body: {
                token,
              },
            }),
          ),
        ),
        switchMap(({ data: { dbName, email, token, nameHex } }) =>
          of(authStateSignal.getValue()).pipe(
            switchMap((previousAuth) =>
              previousAuth?.email !== email
                ? from(reCreateDb({ overwrite: true }))
                : of(previousAuth),
            ),
            tap(() => {
              authStateSignal.setValue({ dbName, email, token, nameHex })

              setUser({ email, id: nameHex })

              setProfile(nameHex)
              currentProfileSignal.setValue(nameHex)
            }),
          ),
        ),
        finalize(() => {
          unlock("authentication")
        }),
      )
    },
  })
}
