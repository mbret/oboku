import { ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import type { SettingsConnectorType } from "@oboku/shared"
import { type UseMutationOptions, useMutation } from "@tanstack/react-query"
import { useExtractConnectorData } from "../../../connectors/useExtractConnectorData"
import type { UseRefreshMetadataVariables } from "../types"

export const createConnectorRefreshMetadata = <T extends SettingsConnectorType>(
  type: T,
) =>
  function useRefreshMetadata({ meta }: Pick<UseMutationOptions, "meta">) {
    const { mutateAsync: extractConnectorData } = useExtractConnectorData(
      { type },
      { meta },
    )

    return useMutation({
      meta,
      mutationFn: async function extractProviderCredentials({
        linkData,
      }: UseRefreshMetadataVariables<T>) {
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
