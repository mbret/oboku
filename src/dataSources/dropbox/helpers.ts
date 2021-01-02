import { useCallback } from "react";
import { authUser } from "./auth";
import { Report } from "../../report";

export const useGetCredentials = () => {
  return useCallback(async () => {
    try {
      const dpx = await authUser()

      return {
        accessToken: dpx.getAccessToken()
      }
    } catch (e) {
      Report.error(e)

      return undefined
    }
  }, [])
}