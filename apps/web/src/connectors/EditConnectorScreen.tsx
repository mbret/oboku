import { ListItemButton, ListItemText } from "@mui/material"
import { isConnectableConnectorType } from "@oboku/shared"
import { memo } from "react"
import { type PathParam, useParams } from "react-router"
import { showConfirmDialog } from "../common/dialogs/presets"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { useSafeGoBack } from "../navigation/useSafeGoBack"
import type { ROUTES } from "../navigation/routes"
import { notify } from "../notifications/toasts"
import { useActiveProfileId } from "../profiles/active/activeProfileId"
import { CONNECTOR_DETAILS, isSettingsConnectorType } from "./connectorDetails"
import { useDeleteConnector } from "./useDeleteConnector"
import { getConnectorForm } from "./AddConnectorScreen"
import { Page } from "../common/Page"
import { PageSection } from "../common/PageSection"
import {
  ConnectorConnectionSection,
  DisconnectConnectorListItem,
} from "./connection/ConnectorConnectionSection"

export const EditConnectorScreen = memo(function EditConnectorScreen() {
  const { type, id = "-1" } =
    useParams<PathParam<typeof ROUTES.INTEGRATION_CONNECTORS_EDIT>>()
  const { goBack } = useSafeGoBack()
  const activeProfileId = useActiveProfileId()
  const { mutate: deleteConnector } = useDeleteConnector()

  if (!isSettingsConnectorType(type)) return null

  const details = CONNECTOR_DETAILS[type]
  const Form = getConnectorForm(type)

  if (!Form) return null

  const isConnectableConnector = isConnectableConnectorType(type)

  const confirmThenDeleteConnector = async () => {
    const confirmed = await showConfirmDialog({
      title: "Delete this connector?",
      message: isConnectableConnector
        ? "If oboku's server keeps this connector's password, it forgets it once oboku reaches the server. To be sure, disconnect the connector first."
        : undefined,
      actions: [{ title: "Delete" }],
    })

    if (!confirmed) return

    deleteConnector(
      { id, type, profileId: activeProfileId },
      {
        onSuccess: function goBackToConnectorList() {
          notify("actionSuccess")
          goBack(details.integrationRoute)
        },
      },
    )
  }

  return (
    <Page>
      <TopBarNavigation title={`${details.label}: Edit connector`} />
      <Form
        connectorId={id}
        onSubmitSuccess={() => goBack(details.integrationRoute)}
      >
        {isConnectableConnector && (
          <ConnectorConnectionSection connectorId={id} connectorType={type} />
        )}
        <PageSection title="Danger zone" tone="danger">
          {isConnectableConnector && (
            <DisconnectConnectorListItem connectorId={id} />
          )}
          <ListItemButton onClick={confirmThenDeleteConnector}>
            <ListItemText primary="Delete this connector" />
          </ListItemButton>
        </PageSection>
      </Form>
    </Page>
  )
})
