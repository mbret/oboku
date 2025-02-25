import { extractIdFromResourceId } from "./lib/resources"
import { useAccessToken } from "./lib/useAccessToken"
import { ObokuPlugin } from "../types"
import { firstValueFrom, map } from "rxjs"
import { useGoogleScripts } from "./lib/scripts"

export const useRemoveBook: ObokuPlugin[`useRemoveBook`] = ({
  requestPopup,
}) => {
  const { requestToken } = useAccessToken({ requestPopup })
  const { getGoogleScripts } = useGoogleScripts()

  return async (link) => {
    await firstValueFrom(
      requestToken({
        scope: [`https://www.googleapis.com/auth/drive`],
      }),
    )

    const gapi = await firstValueFrom(
      getGoogleScripts().pipe(map(([, gapi]) => gapi)),
    )

    const fileId = extractIdFromResourceId(link.resourceId)

    await gapi.client.drive.files.delete({
      fileId,
    })

    return { data: {} }
  }
}
