import type { SynologyDriveBrowseItem } from "@oboku/synology"
import { memo } from "react"
import {
  UploadConnectorSelectionStep,
  type UploadConnectorSelectionStepProps,
} from "../../../upload/UploadConnectorSelectionStep"
import {
  synologyDriveSessionSignal,
  useRequestSynologyDriveSession,
} from "../auth/auth"
import { browseSynologyDrive, type SynologyDriveSession } from "../client"

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

    return (
      <UploadConnectorSelectionStep<SynologyAuthResult>
        {...props}
        authenticate={async (connectorId) => {
          const session = await requestSynologyDriveSession({ connectorId })
          const response = await browseSynologyDrive({ session })
          return {
            connectorId,
            items: response.items,
            session,
          }
        }}
        initialConnectorId={synologyDriveSessionSignal.getValue()?.connectorId}
      />
    )
  },
)
