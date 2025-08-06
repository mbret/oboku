import { useRequestToken } from "./lib/useRequestToken"
import type { UseSynchronizeHook } from "../types"
import { firstValueFrom } from "rxjs"
import { useMutation } from "@tanstack/react-query"

export const useSynchronize: UseSynchronizeHook<"DRIVE"> = ({
  requestPopup,
}) => {
  const { requestToken } = useRequestToken({ requestPopup })

  return useMutation({
    mutationFn: async () => {
      const token = await firstValueFrom(
        requestToken({
          scope: ["https://www.googleapis.com/auth/drive.file"],
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
