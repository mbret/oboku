import { memo } from "react"
import { generatePath, type PathParam, useParams } from "react-router"
import { useSafeGoBack } from "../navigation/useSafeGoBack"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { ROUTES } from "../navigation/routes"
import type { SettingsConnectorType } from "@oboku/shared"
import { CONNECTOR_DETAILS, isSettingsConnectorType } from "./connectorDetails"
import { ConnectorForm as WebdavConnectorForm } from "../integrations/webdav/webdavPlugin/connectors/ConnectorForm"
import { ConnectorForm as SynologyDriveConnectorForm } from "../integrations/synology-drive/synologyDrivePlugin/connectors/ConnectorForm"
import { ConnectorForm as ServerConnectorForm } from "../integrations/server/serverPlugin/connectors/ConnectorForm"
import { Page } from "../common/Page"

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
  const { type } =
    useParams<PathParam<typeof ROUTES.INTEGRATION_CONNECTORS_NEW>>()
  const { goBack } = useSafeGoBack()

  if (!isSettingsConnectorType(type)) return null

  const details = CONNECTOR_DETAILS[type]
  const Form = getConnectorForm(type)

  if (!Form) return null

  return (
    <Page>
      <TopBarNavigation title={`${details.label}: New connector`} />
      <Form
        onSubmitSuccess={() =>
          goBack(generatePath(ROUTES.INTEGRATION_DETAILS, { id: type }))
        }
      />
    </Page>
  )
})
