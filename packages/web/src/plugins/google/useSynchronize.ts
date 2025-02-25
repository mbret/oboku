import { useAccessToken } from "./lib/useAccessToken"
import { ObokuPlugin } from "../types"
import { firstValueFrom } from "rxjs"

export const useSynchronize: ObokuPlugin[`useSynchronize`] = ({
  requestPopup,
}) => {
  const { requestToken } = useAccessToken({ requestPopup })

  return async () => {
    const token = await firstValueFrom(
      requestToken({
        scope: ["https://www.googleapis.com/auth/drive.readonly"],
      }),
    )

    return { data: token }
  }
}
