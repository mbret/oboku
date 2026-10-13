import type { DataSourceDocType } from "@oboku/shared"
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
import { useParams } from "react-router"
import { useDataSource } from "../../dataSources/useDataSource"
import { notify } from "../../notifications/toasts"
import { useDataSourceIncrementalModify } from "../../dataSources/useDataSourceIncrementalModify"
import { useDataSourceLabel } from "../../dataSources/useDataSourceLabel"
import type {
  DataSourceEditFormProps,
  DataSourceSubmitPayload,
} from "../../plugins/types"
import { useSynchronizeDataSource } from "../../dataSources/useSynchronizeDataSource"
import { useRemoveDataSource } from "../../dataSources/useRemoveDataSource"
import { NotFoundPage } from "../../common/NotFoundPage"
import { useSafeGoBack } from "../../navigation/useSafeGoBack"
import { Page } from "../../common/Page"
import { getPluginByType } from "../../plugins/configure"
import { PageContainer } from "../../common/PageContainer"
import { PageSection } from "../../common/PageSection"

const SyncStatusAlert = styled(Alert)(function styleSyncStatusAlert({ theme }) {
  return {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  }
})

const SynchronizeButtonStack = styled(Stack)(
  function styleSynchronizeButtonStack({ theme }) {
    return {
      padding: theme.spacing(2),
    }
  },
)

function renderDataSourceEditForm<T extends DataSourceDocType["type"]>({
  dataSource,
  onSubmit,
}: DataSourceEditFormProps<T>) {
  const DetailsComponent = getPluginByType<T>(
    dataSource.type,
  ).DataSourceEditForm

  return DetailsComponent ? (
    <DetailsComponent dataSource={dataSource} onSubmit={onSubmit} />
  ) : null
}

export const DataSourceDetailsScreen = memo(function DataSourceDetailsScreen() {
  const { id } = useParams<{ id: string }>()
  const { data: dataSource } = useDataSource(id)
  const { goBack } = useSafeGoBack()
  const { mutateAsync: modifyDataSource } = useDataSourceIncrementalModify()
  const label = useDataSourceLabel(dataSource)
  const { mutate: syncDataSource } = useSynchronizeDataSource()
  const { mutate: removeDataSource } = useRemoveDataSource()

  const handleSubmit = (payload: DataSourceSubmitPayload) => {
    modifyDataSource(
      {
        id: dataSource?._id ?? "",
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

  const removeDataSourceThenGoBack = () => {
    if (!id) return

    removeDataSource({ id }, { onSuccess: () => goBack() })
  }

  if (dataSource === null) return <NotFoundPage />

  return (
    <Page>
      <TopBarNavigation title={`${label}`} />
      <PageContainer>
        <SyncStatusAlert
          severity={dataSource?.lastSyncErrorCode ? "error" : "info"}
        >
          {dataSource?.syncStatus === "fetching"
            ? "Synchronizing"
            : dataSource?.lastSyncErrorCode
              ? `Last sync did not succeed`
              : `Last synced on ${new Date(dataSource?.lastSyncedAt ?? 0).toLocaleString()}`}
        </SyncStatusAlert>
      </PageContainer>
      <PageContainer disableGutters>
        {dataSource &&
          renderDataSourceEditForm({
            dataSource,
            onSubmit: handleSubmit,
          })}
        <SynchronizeButtonStack>
          <Button variant="outlined" onClick={() => id && syncDataSource(id)}>
            Synchronize
          </Button>
        </SynchronizeButtonStack>
        <PageSection title="Danger zone" tone="danger">
          <ListItemButton onClick={removeDataSourceThenGoBack}>
            <ListItemText primary="Delete this data source" />
          </ListItemButton>
        </PageSection>
      </PageContainer>
    </Page>
  )
})
