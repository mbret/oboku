import { finalize, from, switchMap } from "rxjs"
import { lock, unlock } from "../common/BlockingBackdrop"
import { httpClient } from "../http/httpClient"
import { useMutation$ } from "reactjrx"
import { useSignIn } from "./useSignIn"

export const useSignUp = () => {
  const { mutateAsync: signIn } = useSignIn()

  return useMutation$({
    mutationFn: (data: { email: string; password: string }) => {
      lock("signup")

      return from(httpClient.signUp(data)).pipe(
        switchMap(() => signIn({ email: data.email, password: data.password })),
        finalize(() => {
          unlock("signup")
        }),
      )
    },
  })
}
