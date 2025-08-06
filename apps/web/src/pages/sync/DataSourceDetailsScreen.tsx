import { Alert, Box, Button, Container, Divider, Stack } from "@mui/material"
import { memo } from "react"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { useParams } from "react-router"
import { plugins } from "../../dataSources"
import { useDataSource } from "../../dataSources/useDataSource"
import { useForm } from "react-hook-form"
import { ControlledTextField } from "../../common/forms/ControlledTextField"
import { useNotifications } from "../../notifications/useNofitications"
import { useDataSourceIncrementalModify } from "../../dataSources/useDataSourceIncrementalModify"
import { useMutation } from "@tanstack/react-query"
import { useDataSourceLabel } from "../../dataSources/useDataSourceLabel"
import type { DataSourceFormData } from "../../plugins/types"
import type { BaseDataSourceDocType } from "@oboku/shared"
import { useSynchronizeDataSource } from "../../dataSources/useSynchronizeDataSource"
import { useRemoveDataSource } from "../../dataSources/useRemoveDataSource"
import { useTags } from "../../tags/helpers"
import { ControlledSelect } from "../../common/forms/ControlledSelect"

export const DataSourceDetailsScreen = memo(() => {
  const { id } = useParams<{ id: string }>()
  const { data: dataSource } = useDataSource(id)
  const obokuPlugin = plugins.find(
    (p) => p.type.toLowerCase() === dataSource?.type.toLowerCase(),
  )
  const { data: tags } = useTags()
  const isDataSourceLoaded = !!dataSource
  const { mutateAsync: modifyDataSource } = useDataSourceIncrementalModify()
  const label = useDataSourceLabel(dataSource)
  const DetailsComponent = obokuPlugin?.DataSourceDetails ?? (() => null)
  const { notify, notifyError } = useNotifications()
  const { mutate: syncDataSource } = useSynchronizeDataSource()
  const { mutate: removeDataSource } = useRemoveDataSource()
  const { control, handleSubmit, watch } = useForm<DataSourceFormData>({
    mode: "onChange",
    defaultValues: {
      name: "",
      tags: [],
      data: {},
    },
    values: {
      tags: dataSource?.tags ?? [],
      name: dataSource?.name ?? "",
      data: dataSource?.data_v2 ?? {},
    },
  })
  const { mutate: submit } = useMutation({
    mutationFn: async (_data: DataSourceFormData) => {
      await modifyDataSource({
        id: dataSource?._id ?? "",
        mutationFunction: (doc) => {
          const newData = {
            ...doc,
            name: _data.name,
            tags: [..._data.tags],
            data_v2: _data.data as Record<string, unknown> | undefined,
          } satisfies BaseDataSourceDocType

          return {
            ...doc,
            ...(newData as typeof doc),
          } as typeof doc
        },
      })
    },
    onSuccess: () => {
      notify("actionSuccess")
    },
    onError: (error) => {
      notifyError(error)
    },
  })

  return (
    <Box display="flex" flex={1} overflow="auto" flexDirection="column">
      <TopBarNavigation title={`${label}`} />
      <Container maxWidth="md">
        <Stack
          component="form"
          onSubmit={handleSubmit((data) => submit(data))}
          py={2}
          justifyContent="space-between"
          display="flex"
          flexDirection="column"
          gap={2}
        >
          <Alert severity={dataSource?.lastSyncErrorCode ? "error" : "info"}>
            {dataSource?.syncStatus === "fetching"
              ? "Synchronizing"
              : dataSource?.lastSyncErrorCode
                ? `Last sync did not succeed`
                : `Last synced on ${new Date(dataSource?.lastSyncedAt ?? 0).toLocaleString()}`}
          </Alert>
          <ControlledTextField
            name="name"
            label="Name"
            control={control}
            rules={{
              required: false,
            }}
            fullWidth
          />
          <ControlledSelect
            label="Tags"
            name="tags"
            fullWidth
            multiple
            options={
              tags?.map((tag) => ({
                label: tag.name ?? "",
                value: tag._id ?? "",
                id: tag._id ?? "",
              })) ?? []
            }
            control={control}
            helperText="Applied to all items during synchronization"
          />
          <DetailsComponent control={control} />
          <Stack gap={1}>
            <Button
              variant="contained"
              type="submit"
              disabled={!isDataSourceLoaded}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              type="button"
              onClick={() => id && syncDataSource(id)}
            >
              Synchronize
            </Button>
            <Divider />
            <Button
              variant="outlined"
              type="button"
              color="error"
              onClick={() => id && removeDataSource({ id })}
            >
              Delete
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
})
