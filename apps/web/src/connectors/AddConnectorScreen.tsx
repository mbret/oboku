import { memo } from "react"
import { useParams } from "react-router"
import { useSafeGoBack } from "../navigation/useSafeGoBack"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import type { SettingsConnectorType } from "@oboku/shared"
import { CONNECTOR_DETAILS } from "./connectorDetails"
import { ConnectorForm as WebdavConnectorForm } from "../plugins/webdav/connectors/ConnectorForm"
import { ConnectorForm as SynologyDriveConnectorForm } from "../plugins/synology-drive/connectors/ConnectorForm"
import { ConnectorForm as ServerConnectorForm } from "../plugins/server/connectors/ConnectorForm"

export function getConnectorForm(type: SettingsConnectorType) {
  switch (type) {
    case "webdav":
      return WebdavConnectorForm
    case "synology-drive":
      return SynologyDriveConnectorForm
    case "server":
      return ServerConnectorForm
    default:
      return null
  }
}

export const AddConnectorScreen = memo(() => {
  const { type } = useParams<{ type: SettingsConnectorType }>()
  const { goBack } = useSafeGoBack()

  if (!type) return null

  const details = CONNECTOR_DETAILS[type]
  const Form = getConnectorForm(type)

  if (!details || !Form) return null

  return (
    <>
      <TopBarNavigation title={`${details.label}: New connector`} />
      <Form onSubmitSuccess={() => goBack(details.manageRoute)} />
    </>
  )
})
