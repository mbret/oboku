import { memo } from "react"
import { useSafeGoBack } from "../../../navigation/useSafeGoBack"
import { TopBarNavigation } from "../../../navigation/TopBarNavigation"
import { ROUTES } from "../../../navigation/routes"
import { ConnectorForm } from "../../../plugins/webdav/connectors/ConnectorForm"

export const AddWebdavConnectorScreen = memo(() => {
  const { goBack } = useSafeGoBack()

  return (
    <>
      <TopBarNavigation title={`WebDAV: New connector`} />
      <ConnectorForm
        onSubmitSuccess={() => {
          goBack(ROUTES.PLUGINS.replace(":plugin", "webdav"))
        }}
      />
    </>
  )
})
