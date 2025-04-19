import { memo } from "react"
import { useSafeGoBack } from "../../../navigation/useSafeGoBack"
import { TopBarNavigation } from "../../../navigation/TopBarNavigation"
import { ROUTES } from "../../../navigation/routes"
import { ConnectorForm } from "../../../plugins/webdav/connectors/ConnectorForm"
import { Button } from "@mui/material"
import { useDeleteConnector } from "../../../plugins/webdav/connectors/useDeleteConnector"
import { useParams } from "react-router"
import { useNotifications } from "../../../notifications/useNofitications"

export const EditWebdavConnectorScreen = memo(() => {
  const { goBack } = useSafeGoBack()
  const { mutate: deleteConnector } = useDeleteConnector()
  const { notify } = useNotifications()
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
            const confirm = window.confirm(
              "Are you sure you want to delete this connector?",
            )

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
