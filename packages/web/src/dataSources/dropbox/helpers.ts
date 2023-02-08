import { useCallback } from "react"
import { authUser } from "./auth"
import { DropboxAuth } from "dropbox"
import { UNIQUE_RESOURCE_IDENTIFIER } from "./constants"

export const useGetCredentials = () => {
  return useCallback(async () => {
    const dpx = await authUser()

    if (dpx instanceof DropboxAuth) {
      return {
        data: {
          accessToken: dpx.getAccessToken()
        }
      }
    }

    return dpx
  }, [])
}

export const extractIdFromResourceId = (resourceId: string) =>
  resourceId.replace(`${UNIQUE_RESOURCE_IDENTIFIER}-`, ``)
