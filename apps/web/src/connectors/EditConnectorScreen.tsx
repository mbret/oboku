import { ListItemButton, ListItemText } from "@mui/material"
import { memo } from "react"
import { type PathParam, useParams } from "react-router"
import { useConfirmation } from "../common/useConfirmation"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { useSafeGoBack } from "../navigation/useSafeGoBack"
import type { ROUTES } from "../navigation/routes"
import { notify } from "../notifications/toasts"
import { CONNECTOR_DETAILS, isSettingsConnectorType } from "./connectorDetails"
import { useDeleteConnector } from "./useDeleteConnector"
import { getConnectorForm } from "./AddConnectorScreen"
import { Page } from "../common/Page"
import { PageSection } from "../common/PageSection"

export const EditConnectorScreen = memo(() => {
  const { type, id = "-1" } =
    useParams<PathParam<typeof ROUTES.INTEGRATION_CONNECTORS_EDIT>>()
  const { goBack } = useSafeGoBack()
  const { mutate: deleteConnector } = useDeleteConnector()
  const confirmation = useConfirmation()

  if (!isSettingsConnectorType(type)) return null

  const details = CONNECTOR_DETAILS[type]
  const Form = getConnectorForm(type)

  if (!Form) return null

  const confirmThenDeleteConnector = () => {
    const confirm = confirmation()

    if (confirm) {
      deleteConnector(
        { id },
        {
          onSuccess: () => {
            notify("actionSuccess")
            goBack(details.integrationRoute)
          },
        },
      )
    }
  }

  return (
    <Page>
      <TopBarNavigation title={`${details.label}: Edit connector`} />
      <Form
        connectorId={id}
        onSubmitSuccess={() => goBack(details.integrationRoute)}
      >
        <PageSection title="Danger zone" tone="danger">
          <ListItemButton onClick={confirmThenDeleteConnector}>
            <ListItemText primary="Delete this connector" />
          </ListItemButton>
        </PageSection>
      </Form>
    </Page>
  )
})
