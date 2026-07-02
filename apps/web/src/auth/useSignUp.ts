import type { RequestSignUpRequest } from "@oboku/shared"
import { from } from "rxjs"
import { useHttpClientApi } from "../http"
import { useMutation$ } from "reactjrx"
import { withLock } from "../common/locks/utils"

export const useSignUp = () => {
  const httpClientApi = useHttpClientApi()

  return useMutation$({
    mutationFn: (data: RequestSignUpRequest) =>
      from(httpClientApi.signUp(data)).pipe(withLock("signup")),
  })
}
