import {
  ObokuErrorCode,
  ObokuSharedError,
  type SynologyDriveDataSourceDocType,
} from "@oboku/shared"
import { useMutation } from "@tanstack/react-query"
import type { UseSynchronizeHook } from "../types"
import { useExtractConnectorData } from "../../connectors/useExtractConnectorData"

export const useSynchronize: UseSynchronizeHook<"synology-drive"> = () => {
  const { mutateAsync: extractConnectorData } = useExtractConnectorData({
    type: "synology-drive",
  })

  return useMutation({
    mutationFn: async (dataSource: SynologyDriveDataSourceDocType) => {
      const connectorId = dataSource.data_v2?.connectorId

      if (!connectorId) {
        throw new ObokuSharedError(
          ObokuErrorCode.ERROR_CONNECTOR_NOT_CONFIGURED,
        )
      }

      const result = await extractConnectorData({ connectorId })

      return {
        providerCredentials: { password: result.data.password },
      }
    },
  })
}
