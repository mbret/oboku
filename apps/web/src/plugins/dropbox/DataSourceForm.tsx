import { Button, Stack, Typography } from "@mui/material"
import type { DataSourceFormData } from "../types"
import { useController, type Control, type UseFormWatch } from "react-hook-form"
import { useDropboxChoose } from "./lib/useDropboxChoose"

export const DataSourceForm = ({
  control,
}: {
  control: Control<DataSourceFormData, any, DataSourceFormData>
  watch: UseFormWatch<DataSourceFormData>
}) => {
  const {
    field: { onChange, value },
  } = useController({
    control,
    rules: { required: false },
    name: "data.folderId",
  })
  const folderId = value as string | undefined
  const { choose } = useDropboxChoose({
    onSuccess: (files) => {
      const id = files[0]?.id

      onChange(id)
    },
  })

  return (
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
  )
}
