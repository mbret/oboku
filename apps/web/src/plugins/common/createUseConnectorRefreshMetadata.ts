import { useMutation } from "@tanstack/react-query"
import { ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import type { SettingsConnectorType } from "@oboku/shared"
import type { ObokuPlugin } from "../types"
import { useExtractConnectorData } from "../../connectors/useExtractConnectorData"

export const createUseConnectorRefreshMetadata = <
  T extends SettingsConnectorType,
>(
  type: T,
): ObokuPlugin<T>["useRefreshMetadata"] => {
  const useRefreshMetadata = () => {
    const { mutateAsync: extractConnectorData } = useExtractConnectorData({
      type,
    })

    return useMutation({
      mutationFn: async ({
        linkData,
      }: {
        linkData?: { connectorId?: string } | null
      }) => {
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

  // ProviderApiCredentials<T> and UseRefreshMetadataVariables<T> don't
  // distribute over the generic T here, so TS can't see that every
  // SettingsConnectorType branch resolves to the shapes above; the runtime
  // behavior is correct for all three (server, webdav, synology-drive).
  return useRefreshMetadata as unknown as ObokuPlugin<T>["useRefreshMetadata"]
}
