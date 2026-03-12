import type { SynologyDriveBrowseItem } from "@oboku/synology"
import { memo } from "react"
import {
  UploadConnectorSelectionStep,
  type UploadConnectorSelectionStepProps,
} from "../../../upload/UploadConnectorSelectionStep"
import {
  clearSynologyDriveSession,
  synologyDriveSessionSignal,
  useRequestSynologyDriveSession,
} from "../auth/auth"
import {
  browseSynologyDrive,
  isSynologyDriveAuthenticationError,
  type SynologyDriveSession,
} from "../client"

export type SynologyAuthResult = {
  connectorId: string
  items: SynologyDriveBrowseItem[]
  session: SynologyDriveSession
}

export const ConnectorSelectionStep = memo(
  (
    props: Omit<
      UploadConnectorSelectionStepProps<SynologyAuthResult>,
      "authenticate" | "initialConnectorId"
    >,
  ) => {
    const requestSynologyDriveSession = useRequestSynologyDriveSession()
    const authenticate = async (connectorId: string) => {
      const session = await requestSynologyDriveSession({ connectorId })

      try {
        const response = await browseSynologyDrive({ session })

        return {
          connectorId,
          items: response.items,
          session,
        }
      } catch (error) {
        if (!isSynologyDriveAuthenticationError(error)) {
          throw error
        }

        clearSynologyDriveSession()

        const refreshedSession = await requestSynologyDriveSession({
          connectorId,
          forceRefresh: true,
        })
        const response = await browseSynologyDrive({
          session: refreshedSession,
        })

        return {
          connectorId,
          items: response.items,
          session: refreshedSession,
        }
      }
    }

    return (
      <UploadConnectorSelectionStep<SynologyAuthResult>
        {...props}
        authenticate={authenticate}
        initialConnectorId={synologyDriveSessionSignal.getValue()?.connectorId}
      />
    )
  },
)
