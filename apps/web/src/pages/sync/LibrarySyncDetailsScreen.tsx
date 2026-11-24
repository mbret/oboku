import type { LibrarySyncDocType, LibrarySyncDocTypeFor } from "@oboku/shared"
import {
  Alert,
  Button,
  ListItemButton,
  ListItemText,
  Stack,
  styled,
} from "@mui/material"
import { memo } from "react"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import type { ROUTES } from "../../navigation/routes"
import { type PathParam, useParams } from "react-router"
import { useLibrarySync } from "../../librarySyncs/useLibrarySync"
import { notify } from "../../notifications/toasts"
import { useLibrarySyncIncrementalModify } from "../../librarySyncs/useLibrarySyncIncrementalModify"
import { useLibrarySyncLabel } from "../../librarySyncs/useLibrarySyncLabel"
import type {
  LibrarySyncFormInternalProps,
  LibrarySyncSubmitPayload,
} from "../../integrations/plugins/types"
import { useSynchronizeLibrarySync } from "../../librarySyncs/useSynchronizeLibrarySync"
import { useRemoveLibrarySync } from "../../librarySyncs/useRemoveLibrarySync"
import { NotFoundPage } from "../../common/NotFoundPage"
import { useSafeGoBack } from "../../navigation/useSafeGoBack"
import { Page } from "../../common/Page"
import { getPluginByType } from "../../integrations/plugins/configure"
import { PageContainer } from "../../common/PageContainer"
import { PageSection } from "../../common/PageSection"

const SyncStatusAlert = styled(Alert)(function styleSyncStatusAlert({ theme }) {
  return {
    marginTop: theme.spacing(2),
  }
})

const SynchronizeButtonStack = styled(Stack)(
  function styleSynchronizeButtonStack({ theme }) {
    return {
      padding: theme.spacing(2),
    }
  },
)

function renderLibrarySyncForm<T extends LibrarySyncDocType["type"]>({
  librarySync,
  ...props
}: LibrarySyncFormInternalProps<LibrarySyncDocTypeFor<T>> & {
  librarySync: { readonly type: T }
}) {
  const PluginForm = getPluginByType<T>(librarySync.type).LibrarySyncForm

  return PluginForm ? <PluginForm {...props} librarySync={librarySync} /> : null
}

export const LibrarySyncDetailsScreen = memo(
  function LibrarySyncDetailsScreen() {
    const { id } = useParams<PathParam<typeof ROUTES.LIBRARY_SYNC_DETAILS>>()
    const { data: librarySync } = useLibrarySync(id)
    const { goBack } = useSafeGoBack()
    const { mutateAsync: modifyLibrarySync } = useLibrarySyncIncrementalModify()
    const label = useLibrarySyncLabel(librarySync)
    const { mutate: syncLibrarySync } = useSynchronizeLibrarySync()
    const { mutate: removeLibrarySync } = useRemoveLibrarySync()

    const handleSubmit = (payload: LibrarySyncSubmitPayload) => {
      modifyLibrarySync(
        {
          id: librarySync?._id ?? "",
          mutationFunction: (doc) =>
            ({
              ...doc,
              name: payload.name,
              tags: payload.tags,
              data_v2: payload.data_v2,
              metadataFileDownloadEnabled: payload.metadataFileDownloadEnabled,
            }) as typeof doc,
        },
        {
          onSuccess: () => notify("actionSuccess"),
        },
      )
    }

    const removeLibrarySyncThenGoBack = () => {
      if (!id) return

      removeLibrarySync({ id }, { onSuccess: () => goBack() })
    }

    if (librarySync === null) return <NotFoundPage />

    return (
      <Page>
        <TopBarNavigation title={`${label}`} />
        <PageContainer>
          <SyncStatusAlert
            severity={librarySync?.lastSyncErrorCode ? "error" : "info"}
          >
            {librarySync?.syncStatus === "fetching"
              ? "Synchronizing"
              : librarySync?.lastSyncErrorCode
                ? `Last sync did not succeed`
                : `Last synced on ${new Date(librarySync?.lastSyncedAt ?? 0).toLocaleString()}`}
          </SyncStatusAlert>
        </PageContainer>
        <PageContainer disableGutters>
          {librarySync &&
            renderLibrarySyncForm({
              librarySync,
              onSubmit: handleSubmit,
              submitLabel: "Save",
            })}
          <SynchronizeButtonStack>
            <Button
              variant="outlined"
              onClick={() => id && syncLibrarySync(id)}
            >
              Synchronize
            </Button>
          </SynchronizeButtonStack>
          <PageSection title="Danger zone" tone="danger">
            <ListItemButton onClick={removeLibrarySyncThenGoBack}>
              <ListItemText primary="Delete this library sync" />
            </ListItemButton>
          </PageSection>
        </PageContainer>
      </Page>
    )
  },
)
