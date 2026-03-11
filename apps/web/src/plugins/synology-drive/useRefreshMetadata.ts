import { useMutation } from "@tanstack/react-query"
import type { ObokuPlugin } from "../types"
import { useRequestSynologyDriveSession } from "./auth/auth"

export const useRefreshMetadata: ObokuPlugin<"synology-drive">[`useRefreshMetadata`] =
  () => {
    const requestSynologyDriveSession = useRequestSynologyDriveSession()

    return useMutation({
      mutationFn: async ({ linkData }) => {
        const connectorId = linkData?.connectorId

        if (!connectorId) {
          throw new Error("No connector id")
        }

        const session = await requestSynologyDriveSession({
          connectorId,
        })

        return {
          providerCredentials: session.auth,
        }
      },
    })
  }
