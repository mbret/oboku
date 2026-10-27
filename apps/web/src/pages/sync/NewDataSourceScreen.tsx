import { memo } from "react"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { Navigate, type PathParam, useParams } from "react-router"
import { plugins } from "../../dataSources"
import { ROUTES } from "../../navigation/routes"
import { useSafeGoBack } from "../../navigation/useSafeGoBack"
import { useCreateDataSource } from "../../dataSources/useCreateDataSource"
import { notify } from "../../notifications/toasts"
import type { DataSourceSubmitPayload } from "../../plugins/types"
import { Page } from "../../common/Page"
import { PageContainer } from "../../common/PageContainer"

export const NewDataSourceScreen = memo(() => {
  const { type } = useParams<PathParam<typeof ROUTES.SYNC_NEW_DATASOURCES>>()
  const { goBack } = useSafeGoBack()
  const plugin = plugins.find(
    (p) => p.type.toLowerCase() === type?.toLowerCase(),
  )
  const PluginForm = plugin?.DataSourceForm
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
      <PageContainer disableGutters>
        {PluginForm && (
          <PluginForm onSubmit={handleSubmit} submitLabel="Confirm" />
        )}
      </PageContainer>
    </Page>
  )
})
