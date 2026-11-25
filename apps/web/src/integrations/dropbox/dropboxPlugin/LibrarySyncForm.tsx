import { Button, Stack, Typography } from "@mui/material"
import { useController, useForm } from "react-hook-form"
import { useDropboxChoose } from "./lib/useDropboxChoose"
import { LibrarySyncFormLayout } from "../../plugins/common/LibrarySyncFormLayout"
import {
  buildLibrarySyncSubmitPayload,
  getLibrarySyncFormBaseDefaults,
} from "../../plugins/common/librarySyncFormHelpers"
import type { DropboxLibrarySyncDocType } from "@oboku/shared"
import type {
  LibrarySyncFormData,
  LibrarySyncFormInternalProps,
} from "../../plugins/types"

type DropboxFormData = LibrarySyncFormData<{
  folderId: string
}>

export const LibrarySyncForm = ({
  librarySync,
  onSubmit,
  submitLabel,
}: LibrarySyncFormInternalProps<DropboxLibrarySyncDocType>) => {
  // react-hook-form is on React Compiler's incompatible-library list.
  // TODO: drop this opt-out once React Compiler handles react-hook-form, and verify the form still tracks state correctly.
  "use no memo"

  const { control, handleSubmit } = useForm<DropboxFormData>({
    mode: "onChange",
    defaultValues: {
      ...getLibrarySyncFormBaseDefaults(librarySync),
      folderId: librarySync?.data_v2?.folderId ?? "",
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
    <LibrarySyncFormLayout
      control={control}
      onSubmit={handleSubmit((data) =>
        onSubmit(
          buildLibrarySyncSubmitPayload(data, { folderId: data.folderId }),
        ),
      )}
      submitLabel={submitLabel}
    >
      <Stack
        sx={{
          gap: 1,
        }}
      >
        <Button
          variant="outlined"
          fullWidth
          onClick={() => choose({ select: "folder" })}
        >
          Choose a folder
        </Button>
        <Typography noWrap>Selected: {folderId || "None"}</Typography>
      </Stack>
    </LibrarySyncFormLayout>
  )
}
