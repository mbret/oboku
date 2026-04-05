import type { CompleteSignUpRequest } from "@oboku/shared"
import { finalize, from, switchMap } from "rxjs"
import { lock, unlock } from "../common/BlockingBackdrop"
import { httpClientApi } from "../http/httpClientApi.web"
import { useMutation$ } from "reactjrx"
import { useSignIn } from "./useSignIn"

export const useCompleteSignUp = () => {
  const { mutateAsync: signIn } = useSignIn()

  return useMutation$({
    mutationFn: (data: CompleteSignUpRequest) => {
      lock("signup-complete")

      return from(httpClientApi.completeSignUp(data)).pipe(
        switchMap(({ data: { email } }) =>
          signIn({ email, password: data.password }),
        ),
        finalize(() => {
          unlock("signup-complete")
        }),
      )
    },
  })
}
