import { useAccessToken } from "./lib/useAccessToken"
import type { UseSynchronizeHook } from "../types"
import { firstValueFrom } from "rxjs"

export const useSynchronize: UseSynchronizeHook<"DRIVE"> = ({
  requestPopup,
}) => {
  const { requestToken } = useAccessToken({ requestPopup })

  return async () => {
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
  }
}
