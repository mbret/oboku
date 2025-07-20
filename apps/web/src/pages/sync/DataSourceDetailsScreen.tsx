import { Box, Button, Container, Stack } from "@mui/material"
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

export const DataSourceDetailsScreen = memo(() => {
  const { id } = useParams<{ id: string }>()
  const { data: dataSource } = useDataSource(id)
  const obokuPlugin = plugins.find(
    (p) => p.type.toLowerCase() === dataSource?.type.toLowerCase(),
  )
  const isDataSourceLoaded = !!dataSource
  const { mutateAsync: modifyDataSource } = useDataSourceIncrementalModify()
  const label = useDataSourceLabel(dataSource)
  const DetailsComponent = obokuPlugin?.DataSourceDetails ?? (() => null)
  const { notify } = useNotifications()
  const { control, handleSubmit } = useForm<DataSourceFormData>({
    mode: "onChange",
    defaultValues: {
      name: "",
      data: {},
    },
    values: {
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
          <ControlledTextField
            name="name"
            label="Name"
            control={control}
            rules={{
              required: false,
            }}
            fullWidth
          />
          <DetailsComponent control={control} />
          <Stack>
            <Button
              variant="contained"
              type="submit"
              disabled={!isDataSourceLoaded}
            >
              Save
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
})
