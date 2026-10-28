import { ListItemButton, ListItemText } from "@mui/material"
import { memo } from "react"
import { generatePath, type PathParam, useParams } from "react-router"
import { useConfirmation } from "../common/useConfirmation"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { useSafeGoBack } from "../navigation/useSafeGoBack"
import { ROUTES } from "../navigation/routes"
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
  const manageRoute = generatePath(ROUTES.INTEGRATION_DETAILS, { id: type })

  if (!Form) return null

  const confirmThenDeleteConnector = () => {
    const confirm = confirmation()

    if (confirm) {
      deleteConnector(
        { id },
        {
          onSuccess: () => {
            notify("actionSuccess")
            goBack(manageRoute)
          },
        },
      )
    }
  }

  return (
    <Page>
      <TopBarNavigation title={`${details.label}: Edit connector`} />
      <Form connectorId={id} onSubmitSuccess={() => goBack(manageRoute)}>
        <PageSection title="Danger zone" tone="danger">
          <ListItemButton onClick={confirmThenDeleteConnector}>
            <ListItemText primary="Delete this connector" />
          </ListItemButton>
        </PageSection>
      </Form>
    </Page>
  )
})
