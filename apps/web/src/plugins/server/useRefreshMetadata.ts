import type { ObokuPlugin } from "../types"
import { useMutation } from "@tanstack/react-query"
import { ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import { useExtractConnectorData } from "../../connectors/useExtractConnectorData"

export const useRefreshMetadata: ObokuPlugin<"server">["useRefreshMetadata"] =
  () => {
    const { mutateAsync: extractConnectorData } = useExtractConnectorData({
      type: "server",
    })

    return useMutation({
      mutationFn: async ({ linkData }) => {
        const connectorId = linkData?.connectorId

        if (!connectorId) {
          throw new ObokuSharedError(
            ObokuErrorCode.ERROR_CONNECTOR_NOT_CONFIGURED,
          )
        }

        const res = await extractConnectorData({ connectorId })

        return {
          providerCredentials: {
            password: res.data.password,
          },
        }
      },
    })
  }
