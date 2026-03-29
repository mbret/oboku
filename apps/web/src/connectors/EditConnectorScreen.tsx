import { Button } from "@mui/material"
import { memo } from "react"
import { useParams } from "react-router"
import { useConfirmation } from "../common/useConfirmation"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { useSafeGoBack } from "../navigation/useSafeGoBack"
import { useNotifications } from "../notifications/useNofitications"
import type { SettingsConnectorType } from "@oboku/shared"
import { CONNECTOR_DETAILS } from "./connectorDetails"
import { useDeleteConnector } from "./useDeleteConnector"
import { getConnectorForm } from "./AddConnectorScreen"

export const EditConnectorScreen = memo(() => {
  const { type, id = "-1" } = useParams<{
    type: SettingsConnectorType
    id: string
  }>()
  const { goBack } = useSafeGoBack()
  const { mutate: deleteConnector } = useDeleteConnector()
  const { notify } = useNotifications()
  const confirmation = useConfirmation()

  if (!type) return null

  const details = CONNECTOR_DETAILS[type]
  const Form = getConnectorForm(type)

  if (!details || !Form) return null

  return (
    <>
      <TopBarNavigation title={`${details.label}: Edit connector`} />
      <Form
        connectorId={id}
        onSubmitSuccess={() => goBack(details.manageRoute)}
      >
        <Button
          color="error"
          onClick={() => {
            const confirm = confirmation()

            if (confirm) {
              deleteConnector(
                { id },
                {
                  onSuccess: () => {
                    notify("actionSuccess")
                    goBack(details.manageRoute)
                  },
                },
              )
            }
          }}
          variant="contained"
        >
          Delete
        </Button>
      </Form>
    </>
  )
})
