import { requestDropboxSourceCredentials } from "./lib/auth"
import type { UseSynchronizeHook } from "../../plugins/types"
import { useMutation } from "@tanstack/react-query"
import { useConfig } from "../../../config/useConfig"

export const useSynchronize: UseSynchronizeHook<"dropbox"> = ({
  requestPopup,
}) => {
  const { data: config } = useConfig()

  return useMutation({
    mutationFn: async function requestSourceCredentials() {
      return {
        providerCredentials: await requestDropboxSourceCredentials({
          requestPopup,
          clientId: config?.DROPBOX_CLIENT_ID,
        }),
      }
    },
  })
}
