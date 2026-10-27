import { authDeleteAccount } from "@oboku/shared"
import { useMutation } from "@tanstack/react-query"
import { useHttpClientApi } from "../http"
import { useSignOut } from "./useSignOut"

export const useDeleteAccount = () => {
  const httpClientApi = useHttpClientApi()
  const signOut = useSignOut()

  return useMutation({
    mutationFn: () => authDeleteAccount({ client: httpClientApi.sdkClient }),
    onSuccess: () => signOut(),
  })
}
