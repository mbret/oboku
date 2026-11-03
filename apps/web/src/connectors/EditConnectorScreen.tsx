import { ListItemButton, ListItemText } from "@mui/material"
import { memo } from "react"
import { type PathParam, useParams } from "react-router"
import { useConfirmation } from "../common/useConfirmation"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { useSafeGoBack } from "../navigation/useSafeGoBack"
import type { ROUTES } from "../navigation/routes"
import { notify } from "../notifications/toasts"
import { isSettingsConnectorType } from "./connectorDetails"
import { getPluginByType } from "../integrations/plugins/configure"
import { useDeleteConnector } from "./useDeleteConnector"
import { Page } from "../common/Page"
import { PageSection } from "../common/PageSection"

export const EditConnectorScreen = memo(function EditConnectorScreen() {
  const { type, id = "-1" } =
    useParams<PathParam<typeof ROUTES.INTEGRATION_CONNECTORS_EDIT>>()
  const { goBack } = useSafeGoBack()
  const { mutate: deleteConnector } = useDeleteConnector()
  const confirmation = useConfirmation()

  if (!isSettingsConnectorType(type)) return null

  const { label, ConnectorForm, integrationRoute } =
    getPluginByType(type).connector

  const confirmThenDeleteConnector = () => {
    const confirm = confirmation()

    if (confirm) {
      deleteConnector(
        { id },
        {
          onSuccess: () => {
            notify("actionSuccess")
            goBack(integrationRoute)
          },
        },
      )
    }
  }

  return (
    <Page>
      <TopBarNavigation title={`${label}: Edit connector`} />
      <ConnectorForm
        connectorId={id}
        onSubmitSuccess={() => goBack(integrationRoute)}
      >
        <PageSection title="Danger zone" tone="danger">
          <ListItemButton onClick={confirmThenDeleteConnector}>
            <ListItemText primary="Delete this connector" />
          </ListItemButton>
        </PageSection>
      </ConnectorForm>
    </Page>
  )
})
