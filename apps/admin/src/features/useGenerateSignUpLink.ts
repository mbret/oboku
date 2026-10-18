import { useMutation } from "@tanstack/react-query"
import type {
  AdminGenerateSignUpLinkData,
  AdminGenerateSignUpLinkResponse,
} from "@oboku/shared"
import { config } from "@/config"
import { authenticatedFetch } from "./authenticatedFetch"

export const useGenerateSignUpLink = () => {
  return useMutation({
    mutationFn: async (
      values: AdminGenerateSignUpLinkData["body"],
    ): Promise<AdminGenerateSignUpLinkResponse> => {
      const response = await authenticatedFetch(
        `${config.apiUrl}/admin/signup-links`,
        {
          method: "POST",
          body: JSON.stringify(values),
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          errorText || response.statusText || "Could not generate sign up link",
        )
      }

      return response.json()
    },
  })
}
