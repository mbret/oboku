import { useRequestToken } from "./lib/useRequestToken"
import type { ObokuPlugin } from "../types"
import { combineLatest, firstValueFrom, map, switchMap } from "rxjs"
import { useMutation } from "@tanstack/react-query"
import { useRequestFilesAccess } from "./lib/useRequestFilesAccess"
import { useGoogleScripts } from "./lib/scripts"
import { GOOGLE_DRIVE_FILE_SCOPES } from "./lib/constants"

export const useRefreshMetadata: ObokuPlugin<"DRIVE">[`useRefreshMetadata`] = ({
  requestPopup,
}) => {
  const { getGoogleScripts } = useGoogleScripts()
  const { requestToken } = useRequestToken({ requestPopup })
  const requestFilesAccess = useRequestFilesAccess({
    requestPopup,
  })

  return useMutation({
    mutationFn: async ({ linkData }) => {
      const fileId =
        linkData && "fileId" in linkData ? linkData.fileId : undefined

      if (!fileId) {
        throw new Error("Google Drive file id is required")
      }

      const token$ = requestToken({
        scope: GOOGLE_DRIVE_FILE_SCOPES,
      })

      const token = await firstValueFrom(
        combineLatest([token$, getGoogleScripts()]).pipe(
          switchMap(([token, [, gapi]]) =>
            requestFilesAccess(gapi, [fileId]).pipe(map(() => token)),
          ),
        ),
      )

      return {
        providerCredentials: {
          access_token: token.access_token,
          created_at: token.created_at,
          token_type: token.token_type,
          expires_in: token.expires_in,
        },
      }
    },
  })
}
