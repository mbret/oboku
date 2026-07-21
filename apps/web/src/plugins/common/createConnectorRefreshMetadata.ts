import { ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import type { SettingsConnectorType } from "@oboku/shared"
import { useMutation } from "@tanstack/react-query"
import { useExtractConnectorData } from "../../connectors/useExtractConnectorData"
import type { UseRefreshMetadataVariables } from "../types"

export const createConnectorRefreshMetadata =
  <T extends SettingsConnectorType>(type: T) =>
  () => {
    const { mutateAsync: extractConnectorData } = useExtractConnectorData({
      type,
    })

    return useMutation({
      mutationFn: async ({ linkData }: UseRefreshMetadataVariables<T>) => {
        // Every connector provider (server, webdav, synology-drive) carries an
        // optional connectorId on its link data, but LinkDataForProvider<T>
        // stays an unresolved conditional for the generic T, hiding the field.
        const connectorLinkData = linkData as
          | { connectorId?: string }
          | null
          | undefined
        const connectorId = connectorLinkData?.connectorId

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
