import { useRequestToken } from "./lib/useRequestToken"
import type { UseSynchronizeHook } from "../types"
import { firstValueFrom } from "rxjs"
import { useMutation } from "@tanstack/react-query"
import { GOOGLE_DRIVE_FILE_SCOPES } from "./lib/constants"

export const useSynchronize: UseSynchronizeHook<"DRIVE"> = ({
  requestPopup,
}) => {
  const { requestToken } = useRequestToken({ requestPopup })

  return useMutation({
    mutationFn: async () => {
      const token = await firstValueFrom(
        requestToken({
          scope: GOOGLE_DRIVE_FILE_SCOPES,
        }),
      )

      return {
        providerCredentials: {
          ...token,
        },
      }
    },
  })
}
