import { useMutation } from "@tanstack/react-query"
import {
  type AdminGenerateSignUpLinkData,
  adminGenerateSignUpLink,
} from "@oboku/shared"
import { apiClient } from "./apiClient"

export const useGenerateSignUpLink = () => {
  return useMutation({
    mutationFn: async (values: AdminGenerateSignUpLinkData["body"]) => {
      const { data } = await adminGenerateSignUpLink({
        client: apiClient,
        body: values,
      })

      return data
    },
  })
}
