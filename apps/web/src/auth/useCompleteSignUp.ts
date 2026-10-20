import { type AuthCompleteSignUpData, authCompleteSignUp } from "@oboku/shared"
import { from, switchMap } from "rxjs"
import { useHttpClientApi } from "../http"
import { useMutation$ } from "reactjrx"
import { withLock } from "../common/locks/utils"
import { useSignIn } from "./useSignIn"

export const useCompleteSignUp = () => {
  const httpClientApi = useHttpClientApi()
  const { mutateAsync: signIn } = useSignIn()

  return useMutation$({
    mutationFn: (data: AuthCompleteSignUpData["body"]) =>
      from(
        authCompleteSignUp({ client: httpClientApi.sdkClient, body: data }),
      ).pipe(
        switchMap(({ data: { email } }) =>
          signIn({ email, password: data.password }),
        ),
        withLock("signup-complete"),
      ),
  })
}
