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

// Synology does not expose session expiry to the browser client, so we refresh
// cached SIDs conservatively before they can linger indefinitely.
export const SYNOLOGY_DRIVE_SESSION_MAX_AGE_MS = 15 * 60 * 1000

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

export const isSynologyDriveSessionExpired = (
  session: SynologyDriveSession,
) => {
  if (!session.createdAt) {
    return true
  }

  const createdAtTime = new Date(session.createdAt).getTime()

  if (Number.isNaN(createdAtTime)) {
    return true
  }

  return Date.now() - createdAtTime >= SYNOLOGY_DRIVE_SESSION_MAX_AGE_MS
}

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
        !isSynologyDriveSessionExpired(existingSession) &&
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
