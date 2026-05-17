import { LinearProgress, Stack, Typography, styled } from "@mui/material"
import type { SubmitEventHandler } from "react"
import type { Control } from "react-hook-form"
import { useObserve } from "reactjrx"
import { EMPTY, type Observable } from "rxjs"
import { normalizeIsbn } from "@oboku/archive-metadata"
import { ControlledTextField } from "../../../common/forms/ControlledTextField"
import type { MetadataFormSection } from "./targets"
import type { MetadataFixerFormValues } from "./types"

const validateIsbn = (raw: string): true | string => {
  const trimmed = raw.trim()

  if (trimmed === "") return true

  return normalizeIsbn(trimmed) !== undefined
    ? true
    : "Not a recognizable ISBN-10 or ISBN-13"
}

const MetadataSectionStack = styled(Stack)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  gap: theme.spacing(1),
  padding: theme.spacing(1.5),
}))

const getHelperText = (section: MetadataFormSection): string | undefined => {
  return section.isbn ? undefined : "No ISBN found."
}

type Props = {
  control: Control<MetadataFixerFormValues>
  sections: MetadataFormSection[]
  isApplying: boolean
  isUploading: boolean
  uploadProgress$: Observable<number> | undefined
  onSubmit: SubmitEventHandler<HTMLFormElement>
}

export function MetadataForm({
  control,
  sections,
  isApplying,
  isUploading,
  uploadProgress$,
  onSubmit,
}: Props) {
  const { data: uploadProgress = 0 } = useObserve(
    () => uploadProgress$ ?? EMPTY,
    [uploadProgress$],
  )
  const uploadPercent = Math.min(
    100,
    Math.max(0, Math.round(uploadProgress * 100)),
  )

  return (
    <Stack component="form" spacing={2} onSubmit={onSubmit} noValidate>
      {sections.map((section) => (
        <MetadataSectionStack key={section.key}>
          <Typography variant="subtitle2">{section.label}</Typography>
          <ControlledTextField<MetadataFixerFormValues>
            name={section.fieldName}
            control={control}
            rules={{ validate: validateIsbn }}
            label="ISBN"
            size="small"
            fullWidth
            helperText={getHelperText(section)}
            disabled={isApplying}
          />
        </MetadataSectionStack>
      ))}
      {isUploading && (
        <Stack spacing={1}>
          <Typography variant="body2">Uploading… {uploadPercent}%</Typography>
          <LinearProgress
            variant={uploadPercent > 0 ? "determinate" : "indeterminate"}
            value={uploadPercent}
          />
        </Stack>
      )}
    </Stack>
  )
}
