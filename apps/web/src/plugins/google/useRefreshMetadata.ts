import { useAccessToken } from "./lib/useAccessToken"
import type { ObokuPlugin } from "../types"
import { firstValueFrom } from "rxjs"
import { useMutation } from "@tanstack/react-query"

export const useRefreshMetadata: ObokuPlugin[`useRefreshMetadata`] = ({
  requestPopup,
}) => {
  const { requestToken } = useAccessToken({ requestPopup })

  return useMutation({
    mutationFn: async () => {
      const token = await firstValueFrom(
        requestToken({
          scope: ["https://www.googleapis.com/auth/drive.readonly"],
        }),
      )

      return {
        data: {
          access_token: token.access_token,
          created_at: token.created_at,
          token_type: token.token_type,
          expires_in: token.expires_in,
        },
      }
    },
  })
}
