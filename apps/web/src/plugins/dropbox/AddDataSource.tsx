import { Button, Stack, Typography } from "@mui/material"
import { type ComponentProps, useState } from "react"
import { Picker } from "./Picker"
import type { DataSourceFormData } from "../types"
import { useController, type Control, type UseFormWatch } from "react-hook-form"

export const AddDataSource = ({
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
  const [showPicker, setShowPicker] = useState(false)

  const onPick: ComponentProps<typeof Picker>["onClose"] = (files) => {
    setShowPicker(false)

    if (files && files.length > 0) {
      const id = files[0]?.id

      onChange(id)
    }
  }

  return (
    <>
      <Stack gap={1}>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => setShowPicker(true)}
        >
          Choose a folder
        </Button>
        <Typography noWrap>Selected: {folderId || "None"}</Typography>
      </Stack>
      {showPicker && (
        <Picker onClose={onPick} select="folder" multiselect={false} />
      )}
    </>
  )
}
