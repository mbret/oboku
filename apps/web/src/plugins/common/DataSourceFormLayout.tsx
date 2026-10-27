import type { FormEventHandler, ReactNode } from "react"
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import { Button, Stack, styled } from "@mui/material"
import type { MetadataFileDownloadOverride } from "@oboku/shared"
import { ControlledTextField } from "../../common/forms/ControlledTextField"
import { ControlledSelect } from "../../common/forms/ControlledSelect"
import { PageSection } from "../../common/PageSection"
import { useTags } from "../../tags/helpers"
import { DataSourceMetadataPolicyPane } from "../../dataSources/metadata/DataSourceMetadataPolicyPane"

const SubmitButtonStack = styled(Stack)(function styleSubmitButtonStack({
  theme,
}) {
  return {
    padding: theme.spacing(0, 2),
  }
})

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
 * provides its own fields as children. Sits in a `PageContainer` with
 * `disableGutters`, like the `PageSection`s it is made of.
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
  // react-hook-form is on React Compiler's incompatible-library list.
  // TODO: drop this opt-out once React Compiler handles react-hook-form, and verify the form still tracks state correctly.
  "use no memo"

  const { data: tags } = useTags()

  return (
    <form onSubmit={onSubmit}>
      <PageSection variant="stack">
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
      </PageSection>
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
      {!!children && <PageSection variant="stack">{children}</PageSection>}
      <SubmitButtonStack>
        <Button variant="contained" type="submit">
          {submitLabel}
        </Button>
      </SubmitButtonStack>
    </form>
  )
}
