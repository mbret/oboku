import type { CompleteSignUpRequest } from "@oboku/shared"
import { from, switchMap } from "rxjs"
import { httpClientApi } from "../http/httpClientApi.web"
import { useMutation$ } from "reactjrx"
import { withLock } from "../common/locks/utils"
import { useSignIn } from "./useSignIn"

export const useCompleteSignUp = () => {
  const { mutateAsync: signIn } = useSignIn()

  return useMutation$({
    mutationFn: (data: CompleteSignUpRequest) =>
      from(httpClientApi.completeSignUp(data)).pipe(
        switchMap(({ data: { email } }) =>
          signIn({ email, password: data.password }),
        ),
        withLock("signup-complete"),
      ),
  })
}
