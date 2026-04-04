import type { RequestSignUpRequest } from "@oboku/shared"
import { finalize, from } from "rxjs"
import { lock, unlock } from "../common/BlockingBackdrop"
import { httpClientApi } from "../http/httpClientApi.web"
import { useMutation$ } from "reactjrx"

export const useSignUp = () => {
  return useMutation$({
    mutationFn: (data: RequestSignUpRequest) => {
      lock("signup")

      return from(httpClientApi.signUp(data)).pipe(
        finalize(() => {
          unlock("signup")
        }),
      )
    },
  })
}
