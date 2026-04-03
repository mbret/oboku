import { useMutation } from "@tanstack/react-query"
import { httpClientApi } from "../http/httpClientApi.web"
import { useSignOut } from "./useSignOut"

export const useDeleteAccount = () => {
  const signOut = useSignOut()

  return useMutation({
    mutationFn: () => httpClientApi.deleteAccount(),
    onSuccess: () => {
      signOut()
    },
  })
}
