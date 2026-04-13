import type { RequestSignUpRequest } from "@oboku/shared"
import { from } from "rxjs"
import { httpClientApi } from "../http/httpClientApi.web"
import { useMutation$ } from "reactjrx"
import { withLock } from "../common/locks/utils"

export const useSignUp = () => {
  return useMutation$({
    mutationFn: (data: RequestSignUpRequest) =>
      from(httpClientApi.signUp(data)).pipe(withLock("signup")),
  })
}
