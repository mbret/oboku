import { useAccessToken } from "./lib/useAccessToken"
import type { ObokuPlugin } from "../types"
import { firstValueFrom, map, switchMap } from "rxjs"
import { useMutation } from "@tanstack/react-query"
import { useRequestFilesAccess } from "./lib/useRequestFilesAccess"
import { extractIdFromResourceId } from "./lib/resources"

export const useRefreshMetadata: ObokuPlugin[`useRefreshMetadata`] = ({
  requestPopup,
}) => {
  const { requestToken } = useAccessToken({ requestPopup })
  const requestFilesAccess = useRequestFilesAccess({
    requestPopup,
  })

  return useMutation({
    mutationFn: async ({ linkResourceId }) => {
      if (!linkResourceId) {
        throw new Error("Link resource id is required")
      }

      const fileId = extractIdFromResourceId(linkResourceId)

      const token$ = requestToken({
        scope: ["https://www.googleapis.com/auth/drive.file"],
      })

      const token = await firstValueFrom(
        token$.pipe(
          switchMap((token) =>
            requestFilesAccess([fileId]).pipe(map(() => token)),
          ),
        ),
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
