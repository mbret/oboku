import type { FormEventHandler, ReactNode } from "react"
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import { Button, Stack } from "@mui/material"
import type { MetadataFileDownloadOverride } from "@oboku/shared"
import { ControlledTextField } from "../../common/forms/ControlledTextField"
import { ControlledSelect } from "../../common/forms/ControlledSelect"
import { useTags } from "../../tags/helpers"
import { DataSourceMetadataPolicyPane } from "../../dataSources/metadata/DataSourceMetadataPolicyPane"

type DataSourceFormBase = {
  name: string
  tags: string[]
  metadataFileDownloadEnabled: MetadataFileDownloadOverride
}

/**
 * Shared form shell for all data source create / edit forms.
 *
 * Renders the `<form>` element, the common name + tags + metadata policy
 * fields, plugin-specific children, and the submit button. Each plugin only
 * provides its own fields as children.
 *
 * The `as FieldPath<T>` casts below are required because TypeScript cannot
 * resolve concrete paths from a generic type parameter, even though the
 * `DataSourceFormBase` constraint guarantees those fields exist on `T`.
 */
export function DataSourceFormLayout<
  T extends FieldValues & DataSourceFormBase,
>({
  control,
  onSubmit,
  submitLabel,
  children,
}: {
  control: Control<T>
  onSubmit: FormEventHandler<HTMLFormElement>
  submitLabel: string
  children?: ReactNode
}) {
  const { data: tags } = useTags()

  return (
    <Stack
      component="form"
      onSubmit={onSubmit}
      sx={{
        gap: 2,
      }}
    >
      <ControlledTextField
        name={"name" as FieldPath<T>}
        label="Name"
        control={control}
        rules={{ required: false }}
        fullWidth
      />
      <ControlledSelect
        name={"tags" as FieldPath<T>}
        label="Tags"
        control={control}
        fullWidth
        multiple
        options={
          tags?.map((tag) => ({
            label: tag.name ?? "",
            value: tag._id ?? "",
            id: tag._id ?? "",
          })) ?? []
        }
        helperText="Applied to all items during synchronization"
      />
      <Controller
        control={control}
        name={"metadataFileDownloadEnabled" as FieldPath<T>}
        render={({ field }) => (
          <DataSourceMetadataPolicyPane
            // The cast is needed because the generic FieldPath<T> erases the
            // concrete value type even though DataSourceFormBase guarantees it
            // is a MetadataFileDownloadOverride.
            fileDownloadOverride={field.value as MetadataFileDownloadOverride}
            onFileDownloadChange={field.onChange}
          />
        )}
      />
      {children}
      <Button variant="contained" type="submit">
        {submitLabel}
      </Button>
    </Stack>
  )
}
