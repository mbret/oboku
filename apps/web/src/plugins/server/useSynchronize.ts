import type { ServerDataSourceDocType } from "@oboku/shared"
import { useMutation } from "@tanstack/react-query"
import type { UseSynchronizeHook } from "../types"
import { useExtractConnectorData } from "../../connectors/useExtractConnectorData"

export const useSynchronize: UseSynchronizeHook<"server"> = () => {
  const { mutateAsync: extractConnectorData } = useExtractConnectorData({
    type: "server",
  })

  return useMutation({
    mutationFn: async (dataSource: ServerDataSourceDocType) => {
      const connectorId = dataSource.data_v2?.connectorId

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
