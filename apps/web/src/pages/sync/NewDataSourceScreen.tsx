import {
  Box,
  Container,
  Button,
  C,
  Dividerontainer,
  Stack,
  Divider,
} from "@mui/material"
import { memo } from "react"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { Navigate, useNavigate, useParams } from "react-router"
import { plugins } from "../../dataSources"
import { useCreateRequestPopupDialog } from "../../plugins/useCreateRequestPopupDialog"
import { ROUTES } from "../../navigation/routes"
import { useSafeGoBack } from "../../navigation/useSafeGoBack"
import { useForm } from "react-hook-form"
import type { DataSourceFormData } from "../../plugins/types"
import { ControlledTextField } from "../../common/forms/ControlledTextField"
import { ControlledSelect } from "../../common/forms/ControlledSelect"
import { useTags } from "../../tags/helpers"
import { useCreateDataSource } from "../../dataSources/useCreateDataSource"
import { useMutation } from "@tanstack/react-query"
import { useNotifications } from "../../notifications/useNofitications"

export const NewDataSourceScreen = memo(() => {
  const { id } = useParams<{ id: string }>()
  const createRequestPopup = useCreateRequestPopupDialog()
  const navigate = useNavigate()
  const { goBack } = useSafeGoBack()
  const { data: tags } = useTags()
  const plugin = plugins.find((p) => p.type.toLowerCase() === id?.toLowerCase())
  const PluginAddDataSource = plugin?.AddDataSource ?? (() => null)
  const { mutate: createDataSource } = useCreateDataSource()
  const { notify, notifyError } = useNotifications()
  const { control, handleSubmit, watch } = useForm<DataSourceFormData>({
    mode: "onChange",
    defaultValues: {
      name: "",
      tags: [],
      data: {},
    },
  })
  const { mutate: submit } = useMutation({
    mutationFn: async (_data: DataSourceFormData) => {
      if (!plugin?.type) {
        throw new Error("Plugin type is required")
      }

      createDataSource({
        type: plugin?.type,
        data_v2: _data.data,
        name: _data.name,
        tags: [..._data.tags],
      })
      goBack(ROUTES.SYNC_DATASOURCES)
    },
    onSuccess: () => {
      notify("actionSuccess")
    },
    onError: (error) => {
      notifyError(error)
    },
  })

  if (!plugin) {
    return <Navigate to={ROUTES.SYNC_DATASOURCES} replace />
  }

  return (
    <Box display="flex" flex={1} overflow="auto" flexDirection="column">
      <TopBarNavigation title={`New ${plugin.name} data source`} />
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
          <PluginAddDataSource control={control} />
          <Stack gap={1}>
            <Button variant="contained" type="submit">
              Confirm
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
})
