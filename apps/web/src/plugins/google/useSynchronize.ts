import { useAccessToken } from "./lib/useAccessToken"
import type { UseSynchronizeHook } from "../types"
import { firstValueFrom } from "rxjs"
import { useMutation } from "@tanstack/react-query"

export const useSynchronize: UseSynchronizeHook<"DRIVE"> = ({
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
          ...token,
        },
      }
    },
  })
}
