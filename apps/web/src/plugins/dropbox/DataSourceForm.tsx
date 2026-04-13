import { Button, Stack, Typography } from "@mui/material"
import { useController, useForm } from "react-hook-form"
import { useDropboxChoose } from "./lib/useDropboxChoose"
import { DataSourceFormLayout } from "../common/DataSourceFormLayout"
import type { DropboxDataSourceDocType } from "@oboku/shared"
import type { DataSourceFormData, DataSourceFormInternalProps } from "../types"

type DropboxFormData = DataSourceFormData<{
  folderId: string
}>

export const DataSourceForm = ({
  dataSource,
  onSubmit,
  submitLabel,
}: DataSourceFormInternalProps<DropboxDataSourceDocType>) => {
  const { control, handleSubmit } = useForm<DropboxFormData>({
    mode: "onChange",
    defaultValues: {
      name: dataSource?.name ?? "",
      tags: [...(dataSource?.tags ?? [])],
      folderId: dataSource?.data_v2?.folderId ?? "",
    },
  })
  const {
    field: { onChange, value: folderId },
  } = useController({
    control,
    rules: { required: false },
    name: "folderId",
  })
  const { choose } = useDropboxChoose({
    onSuccess: (files) => {
      const id = files[0]?.id

      onChange(id)
    },
  })

  return (
    <DataSourceFormLayout
      control={control}
      onSubmit={handleSubmit((data) =>
        onSubmit({
          name: data.name,
          tags: data.tags,
          data_v2: { folderId: data.folderId },
        }),
      )}
      submitLabel={submitLabel}
    >
      <Stack gap={1}>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => choose({ select: "folder" })}
        >
          Choose a folder
        </Button>
        <Typography noWrap>Selected: {folderId || "None"}</Typography>
      </Stack>
    </DataSourceFormLayout>
  )
}
