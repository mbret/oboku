import { useCallback } from "react"
import { signal } from "reactjrx"
import { signInSynologyDrive, type SynologyDriveSession } from "../client"
import { useExtractConnectorData } from "../../../connectors/useExtractConnectorData"

type SynologyDriveRequest = {
  connectorId: string
  forceRefresh?: boolean
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

const matchesSessionConnectorData = (
  session: SynologyDriveSession,
  connectorData: {
    password: string
    url: string
    username: string
  },
) =>
  session.auth.baseUrl === connectorData.url &&
  session.auth.password === connectorData.password &&
  session.auth.username === connectorData.username

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
      const { data } = await extractConnectorData({
        connectorId: request.connectorId,
      })

      if (
        existingSession &&
        matchesSessionRequest(existingSession, request) &&
        matchesSessionConnectorData(existingSession, data) &&
        !request.forceRefresh
      ) {
        return existingSession
      }

      const signInWithConnector = async () => {
        const session = await signInSynologyDrive({
          baseUrl: data.url,
          password: data.password,
          username: data.username,
        })
        const sessionWithConnector = {
          ...session,
          connectorId: request.connectorId,
          createdAt: new Date().toISOString(),
        }

        synologyDriveSessionSignal.setValue(sessionWithConnector)

        return sessionWithConnector
      }

      try {
        return await signInWithConnector()
      } catch (error) {
        clearSynologyDriveSession()

        throw error
      }
    },
    [extractConnectorData],
  )
}
