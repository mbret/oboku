import { memo } from "react"
import { type PathParam, useParams } from "react-router"
import { useSafeGoBack } from "../navigation/useSafeGoBack"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import type { ROUTES } from "../navigation/routes"
import { isSettingsConnectorType } from "./connectorDetails"
import { getPluginByType } from "../integrations/plugins/configure"
import { Page } from "../common/Page"

export const AddConnectorScreen = memo(function AddConnectorScreen() {
  const { type } =
    useParams<PathParam<typeof ROUTES.INTEGRATION_CONNECTORS_NEW>>()
  const { goBack } = useSafeGoBack()

  if (!isSettingsConnectorType(type)) return null

  const { label, ConnectorForm, integrationRoute } =
    getPluginByType(type).connector

  return (
    <Page>
      <TopBarNavigation title={`${label}: New connector`} />
      <ConnectorForm onSubmitSuccess={() => goBack(integrationRoute)} />
    </Page>
  )
})
