import { memo } from "react"
import { useSafeGoBack } from "../../../navigation/useSafeGoBack"
import { TopBarNavigation } from "../../../navigation/TopBarNavigation"
import { ROUTES } from "../../../navigation/routes"
import { ConnectorForm } from "../../../plugins/webdav/connectors/ConnectorForm"
import { Button } from "@mui/material"
import { useDeleteConnector } from "../../../plugins/webdav/connectors/useDeleteConnector"
import { useParams } from "react-router"
import { useNotifications } from "../../../notifications/useNofitications"
import { useConfirmation } from "../../../common/useConfirmation"

export const EditWebDavConnectorScreen = memo(() => {
  const { goBack } = useSafeGoBack()
  const { mutate: deleteConnector } = useDeleteConnector()
  const { notify } = useNotifications()
  const confirmation = useConfirmation()
  const { id = "-1" } = useParams()

  return (
    <>
      <TopBarNavigation title={`WebDAV: Edit connector`} />
      <ConnectorForm
        connectorId={id}
        onSubmitSuccess={() => {
          goBack(ROUTES.PLUGINS.replace(":plugin", "webdav"))
        }}
      >
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            const confirm = confirmation()

            if (confirm) {
              deleteConnector(
                { id },
                {
                  onSuccess: () => {
                    notify("actionSuccess")
                    goBack(ROUTES.PLUGINS.replace(":plugin", "webdav"))
                  },
                },
              )
            }
          }}
        >
          Delete
        </Button>
      </ConnectorForm>
    </>
  )
})
