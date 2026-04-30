import { Container, Stack } from "@mui/material"
import { memo } from "react"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { Navigate, useParams } from "react-router"
import { plugins } from "../../dataSources"
import { ROUTES } from "../../navigation/routes"
import { useSafeGoBack } from "../../navigation/useSafeGoBack"
import { useCreateDataSource } from "../../dataSources/useCreateDataSource"
import { notify } from "../../notifications/toasts"
import type { DataSourceSubmitPayload } from "../../plugins/types"
import { Page } from "../../common/Page"

export const NewDataSourceScreen = memo(() => {
  const { id } = useParams<{ id: string }>()
  const { goBack } = useSafeGoBack()
  const plugin = plugins.find((p) => p.type.toLowerCase() === id?.toLowerCase())
  const PluginForm = plugin?.DataSourceCreateForm
  const { mutate: createDataSource } = useCreateDataSource()

  const handleSubmit = (payload: DataSourceSubmitPayload) => {
    if (!plugin?.type) return

    createDataSource(
      {
        type: plugin.type,
        data_v2: payload.data_v2,
        name: payload.name,
        tags: payload.tags,
        metadataFileDownloadEnabled: payload.metadataFileDownloadEnabled,
      },
      {
        onSuccess: () => {
          notify("actionSuccess")
          goBack(ROUTES.SYNC_DATASOURCES)
        },
      },
    )
  }

  if (!plugin) {
    return <Navigate to={ROUTES.SYNC_DATASOURCES} replace />
  }

  return (
    <Page>
      <TopBarNavigation title={`New ${plugin.name} data source`} />
      <Container maxWidth="md">
        <Stack
          sx={{
            py: 2,
            gap: 2,
          }}
        >
          {PluginForm && <PluginForm onSubmit={handleSubmit} />}
        </Stack>
      </Container>
    </Page>
  )
})
