import { memo } from "react"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { Navigate, type PathParam, useParams } from "react-router"
import { plugins } from "../../integrations/plugins/configure"
import { ROUTES } from "../../navigation/routes"
import { useSafeGoBack } from "../../navigation/useSafeGoBack"
import { useCreateLibrarySync } from "../../librarySyncs/useCreateLibrarySync"
import { notify } from "../../notifications/toasts"
import type { LibrarySyncSubmitPayload } from "../../integrations/plugins/types"
import { Page } from "../../common/Page"
import { PageContainer } from "../../common/PageContainer"

export const NewLibrarySyncScreen = memo(function NewLibrarySyncScreen() {
  const { type } = useParams<PathParam<typeof ROUTES.SYNC_NEW_LIBRARY_SYNC>>()
  const { goBack } = useSafeGoBack()
  const plugin = plugins.find(
    (p) => p.type.toLowerCase() === type?.toLowerCase(),
  )
  const PluginForm = plugin?.LibrarySyncForm
  const { mutate: createLibrarySync } = useCreateLibrarySync()

  const handleSubmit = (payload: LibrarySyncSubmitPayload) => {
    if (!plugin?.type) return

    createLibrarySync(
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
          goBack(ROUTES.SYNC_LIBRARY_SYNCS)
        },
      },
    )
  }

  if (!plugin) {
    return <Navigate to={ROUTES.SYNC_LIBRARY_SYNCS} replace />
  }

  return (
    <Page>
      <TopBarNavigation title={`New ${plugin.name} library sync`} />
      <PageContainer disableGutters>
        {PluginForm && (
          <PluginForm onSubmit={handleSubmit} submitLabel="Confirm" />
        )}
      </PageContainer>
    </Page>
  )
})
