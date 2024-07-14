import { extractIdFromResourceId } from "./lib/resources"
import { useAccessToken } from "./lib/useAccessToken"
import { ObokuPlugin } from "../plugin-front"
import { firstValueFrom } from "rxjs"
import { gapiOrThrow$ } from "./lib/gapi"

export const useRemoveBook: ObokuPlugin[`useRemoveBook`] = ({
  requestPopup
}) => {
  const { requestToken } = useAccessToken({ requestPopup })

  return async (link) => {
    await firstValueFrom(
      requestToken({
        scope: [`https://www.googleapis.com/auth/drive`]
      })
    )

    const gapi = await firstValueFrom(gapiOrThrow$)

    const fileId = extractIdFromResourceId(link.resourceId)

    await gapi.client.drive.files.delete({
      fileId
    })

    return { data: {} }
  }
}
