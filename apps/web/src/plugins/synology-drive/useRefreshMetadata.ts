import { useMutation } from "@tanstack/react-query"
import type { ObokuPlugin } from "../types"
import { useExtractConnectorData } from "../../connectors/useExtractConnectorData"

export const useRefreshMetadata: ObokuPlugin<"synology-drive">[`useRefreshMetadata`] =
  () => {
    const { mutateAsync: extractConnectorData } = useExtractConnectorData({
      type: "synology-drive",
    })

    return useMutation({
      mutationFn: async ({ linkData }) => {
        const connectorId = linkData?.connectorId

        if (!connectorId) {
          throw new Error("No connector id")
        }

        const result = await extractConnectorData({ connectorId })

        return {
          providerCredentials: { password: result.data.password },
        }
      },
    })
  }
