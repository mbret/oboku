import { useMutation } from "@tanstack/react-query"
import { type AdminSignInData, adminSignIn } from "@oboku/shared"
import { authState, persistTokens } from "./states"
import { apiClient } from "./apiClient"

export const useLogin = () => {
  return useMutation({
    mutationFn: async (values: AdminSignInData["body"]) => {
      const { data, error, response } = await adminSignIn({
        client: apiClient,
        fetch,
        throwOnError: false,
        body: values,
      })

      const didReachApi = !!response

      if (!didReachApi) {
        throw error
      }

      if (!data?.access_token) {
        throw new Error(
          response.status === 401
            ? "Invalid login or password"
            : "Unable to sign in",
        )
      }

      persistTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      })
      authState.update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      })
    },
  })
}
