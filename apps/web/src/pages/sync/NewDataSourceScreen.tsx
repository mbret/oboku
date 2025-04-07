import { Box } from "@mui/material"
import { memo } from "react"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { Navigate, useParams } from "react-router"
import { plugins } from "../../dataSources"
import { useCreateRequestPopupDialog } from "../../plugins/useCreateRequestPopupDialog"
import { ROUTES } from "../../navigation/routes"
import { useSafeGoBack } from "../../navigation/useSafeGoBack"

export const NewDataSourceScreen = memo(() => {
  const { id } = useParams<{ id: string }>()
  const createRequestPopup = useCreateRequestPopupDialog()
  const { goBack } = useSafeGoBack()
  const plugin = plugins.find((p) => p.type.toLowerCase() === id?.toLowerCase())
  const PluginAddDataSource = plugin?.AddDataSource ?? (() => null)

  if (!plugin) {
    return <Navigate to={ROUTES.SYNC_DATASOURCES} replace />
  }

  return (
    <Box display="flex" flex={1} overflow="auto" flexDirection="column">
      <TopBarNavigation title={`New ${plugin.name} data source`} />
      <PluginAddDataSource
        onClose={() => {
          goBack()
        }}
        requestPopup={createRequestPopup({ name: plugin.name })}
      />
    </Box>
  )
})
