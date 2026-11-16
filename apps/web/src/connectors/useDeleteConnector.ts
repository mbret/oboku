import {
  isConnectableConnectorType,
  type SettingsConnectorType,
} from "@oboku/shared"
import { useMutation$ } from "reactjrx"
import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { from, switchMap } from "rxjs"
import { useDisconnectConnector } from "./connection/useDisconnectConnector"

type DeleteConnectorRequest = {
  id: string
  type: SettingsConnectorType
  /** The profile that deletes, whose session the disconnect request must carry. */
  profileId: string | undefined
}

/**
 * Deletes the connector from the settings, then asks oboku's server to forget
 * its connection. When that request fails, as it does offline, the server
 * forgets the connection the next time the app lists connections after the
 * deletion syncs.
 */
export const useDeleteConnector = () => {
  const { mutate: disconnectConnector } = useDisconnectConnector({
    meta: { suppressGlobalErrorToast: true },
  })

  return useMutation$({
    mutationFn: ({ id }: DeleteConnectorRequest) => {
      return getLatestDatabase().pipe(
        switchMap((db) => {
          return from(db.settings.deleteConnector(id))
        }),
      )
    },
    onSuccess: function disconnectDeletedConnector(
      _settings,
      { id, type, profileId },
    ) {
      if (!isConnectableConnectorType(type)) return

      disconnectConnector({ profileId, connectorId: id })
    },
  })
}
