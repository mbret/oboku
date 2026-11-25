import { ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import type {
  LibrarySyncDocTypeFor,
  SettingsConnectorType,
} from "@oboku/shared"
import { useMutation } from "@tanstack/react-query"
import { useExtractConnectorData } from "../../../connectors/useExtractConnectorData"

export const createConnectorSynchronize = <T extends SettingsConnectorType>(
  type: T,
) =>
  function useSynchronize() {
    const { mutateAsync: extractConnectorData } = useExtractConnectorData({
      type,
    })

    return useMutation({
      mutationFn: async function extractSourceCredentials(
        librarySync: LibrarySyncDocTypeFor<T>,
      ) {
        const connectorLibrarySync: LibrarySyncDocTypeFor<SettingsConnectorType> =
          librarySync
        const connectorId = connectorLibrarySync.data_v2?.connectorId

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
