import { Alert, Button, Container, Divider, Stack } from "@mui/material"
import { memo } from "react"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { useParams } from "react-router"
import { plugins } from "../../dataSources"
import { useDataSource } from "../../dataSources/useDataSource"
import { useNotifications } from "../../notifications/useNofitications"
import { useDataSourceIncrementalModify } from "../../dataSources/useDataSourceIncrementalModify"
import { useDataSourceLabel } from "../../dataSources/useDataSourceLabel"
import type { DataSourceSubmitPayload } from "../../plugins/types"
import { useSynchronizeDataSource } from "../../dataSources/useSynchronizeDataSource"
import { useRemoveDataSource } from "../../dataSources/useRemoveDataSource"
import { NotFoundPage } from "../../common/NotFoundPage"
import { useSafeGoBack } from "../../navigation/useSafeGoBack"
import { Page } from "../../common/Page"

export const DataSourceDetailsScreen = memo(() => {
  const { id } = useParams<{ id: string }>()
  const { data: dataSource } = useDataSource(id)
  const obokuPlugin = plugins.find(
    (p) => p.type.toLowerCase() === dataSource?.type.toLowerCase(),
  )
  const { goBack } = useSafeGoBack()
  const { mutateAsync: modifyDataSource } = useDataSourceIncrementalModify()
  const label = useDataSourceLabel(dataSource)
  const DetailsComponent = obokuPlugin?.DataSourceEditForm
  const { notify, notifyError } = useNotifications()
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
          }) as typeof doc,
      },
      {
        onSuccess: () => notify("actionSuccess"),
        onError: (error) => notifyError(error),
      },
    )
  }

  if (dataSource === null) return <NotFoundPage />

  return (
    <Page>
      <TopBarNavigation title={`${label}`} />
      <Container maxWidth="md">
        <Stack py={2} gap={2}>
          <Alert severity={dataSource?.lastSyncErrorCode ? "error" : "info"}>
            {dataSource?.syncStatus === "fetching"
              ? "Synchronizing"
              : dataSource?.lastSyncErrorCode
                ? `Last sync did not succeed`
                : `Last synced on ${new Date(dataSource?.lastSyncedAt ?? 0).toLocaleString()}`}
          </Alert>
          {DetailsComponent && dataSource && (
            <DetailsComponent dataSource={dataSource} onSubmit={handleSubmit} />
          )}
          <Stack gap={1}>
            <Button variant="outlined" onClick={() => id && syncDataSource(id)}>
              Synchronize
            </Button>
            <Divider />
            <Button
              variant="outlined"
              color="error"
              onClick={() =>
                id &&
                removeDataSource(
                  { id },
                  {
                    onSuccess: () => goBack(),
                  },
                )
              }
            >
              Delete
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Page>
  )
})
