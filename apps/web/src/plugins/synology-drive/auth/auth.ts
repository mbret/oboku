import { useCallback } from "react"
import { signal } from "reactjrx"
import { signInSynologyDrive, type SynologyDriveSession } from "../client"
import { useExtractConnectorData } from "../../../connectors/useExtractConnectorData"

type SynologyDriveRequest = {
  connectorId: string
}

export const synologyDriveSessionSignal = signal<
  SynologyDriveSession | undefined
>({
  default: undefined,
})

const matchesSessionRequest = (
  session: SynologyDriveSession,
  request: SynologyDriveRequest,
) => !!request.connectorId && session.connectorId === request.connectorId

export const clearSynologyDriveSession = () => {
  synologyDriveSessionSignal.setValue(undefined)
}

export const useRequestSynologyDriveSession = () => {
  const { mutateAsync: extractConnectorData } = useExtractConnectorData({
    type: "synology-drive",
  })

  return useCallback(
    async (request: SynologyDriveRequest) => {
      const existingSession = synologyDriveSessionSignal.getValue()

      if (existingSession && matchesSessionRequest(existingSession, request)) {
        return existingSession
      }

      const signInWithConnector = async (connectorId: string) => {
        const { data } = await extractConnectorData({
          connectorId,
        })

        const session = await signInSynologyDrive({
          baseUrl: data.url,
          password: data.password,
          username: data.username,
        })
        const sessionWithConnector = {
          ...session,
          connectorId,
          createdAt: new Date().toISOString(),
        }

        synologyDriveSessionSignal.setValue(sessionWithConnector)

        return sessionWithConnector
      }

      try {
        return await signInWithConnector(request.connectorId)
      } catch (error) {
        clearSynologyDriveSession()

        throw error
      }
    },
    [extractConnectorData],
  )
}
